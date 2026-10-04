import express, { Request, Response, NextFunction } from 'express';
import { getOrAssignParticipant } from '../services/assignment.ts';
import { submitSurveyResponse, SurveySubmissionPayload } from '../services/submission.ts';
import {
  getExperimentMetrics,
  getRecentResponses,
  seedSimulationResponses,
  resetExperimentData,
  deleteResponseById,
  deleteResponsesBatch,
} from '../services/analytics.ts';
import {
  getFlatExportRecords,
  generateCsvString,
  generateXlsxBuffer,
  generateSpssSyntax,
  generateRScript,
  generatePythonScript,
} from '../services/export.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

export const apiApp = express();

apiApp.use(express.json());
apiApp.use(express.urlencoded({ extended: true }));

// --- PARTICIPANT EXPERIMENT ENDPOINTS ---

// Initialize or resume participant
apiApp.post('/api/participant/init', async (req: Request, res: Response) => {
  try {
    const { participantUuid } = req.body;
    const session = await getOrAssignParticipant(participantUuid);
    res.json({
      success: true,
      participantUuid: session.participantUuid,
      groupType: session.groupType,
      hasSubmitted: session.hasSubmitted,
      createdAt: session.createdAt,
    });
  } catch (error: any) {
    console.error('Participant init failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize participant session',
    });
  }
});

// Check participant status
apiApp.get('/api/participant/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const session = await getOrAssignParticipant(uuid);
    res.json({
      success: true,
      participantUuid: session.participantUuid,
      groupType: session.groupType,
      hasSubmitted: session.hasSubmitted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit survey
apiApp.post('/api/survey/submit', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SurveySubmissionPayload;

    if (!payload.participantUuid) {
      return res.status(400).json({ success: false, error: 'Missing participant identifier' });
    }

    const result = await submitSurveyResponse(payload);
    res.json(result);
  } catch (error: any) {
    console.error('Survey submission failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record response',
    });
  }
});

// --- RESEARCHER / ADMIN ENDPOINTS ---

// Researcher password check for dashboard access
apiApp.post('/api/admin/login', (req: Request, res: Response) => {
  const { passcode } = req.body;
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'researcher2025';

  if (passcode === adminSecret) {
    return res.json({
      success: true,
      token: adminSecret,
      user: {
        uid: 'admin-lead-researcher',
        email: 'lead.researcher@academic.edu',
        role: 'lead_investigator',
      },
    });
  }

  res.status(401).json({ success: false, error: 'Invalid researcher passcode' });
});

// Admin metrics
apiApp.get('/api/admin/metrics', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const metrics = await getExperimentMetrics();
    res.json({ success: true, metrics });
  } catch (error: any) {
    console.error('Failed to fetch metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin responses list
apiApp.get('/api/admin/responses', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(500, Number(req.query.limit) || 100);
    const responsesList = await getRecentResponses(limit);
    res.json({ success: true, responses: responsesList });
  } catch (error: any) {
    console.error('Failed to fetch responses list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export CSV flat table
apiApp.get('/api/admin/export/csv', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const records = await getFlatExportRecords();
    const csvContent = generateCsvString(records);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="witte_2025_imt_data.csv"');
    res.send(csvContent);
  } catch (error: any) {
    console.error('CSV export failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export XLSX flat table
apiApp.get('/api/admin/export/xlsx', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const records = await getFlatExportRecords();
    const buffer = generateXlsxBuffer(records);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="witte_2025_imt_data.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    console.error('XLSX export failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export syntax files (SPSS, R, Python)
apiApp.get('/api/admin/export/syntax/:type', requireAuth, (req: AuthRequest, res: Response) => {
  const type = req.params.type.toLowerCase();

  if (type === 'spss') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="witte_2025_spss_syntax.sps"');
    return res.send(generateSpssSyntax());
  }

  if (type === 'r') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="witte_2025_lavaan_sem.R"');
    return res.send(generateRScript());
  }

  if (type === 'python') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="witte_2025_semopy_sem.py"');
    return res.send(generatePythonScript());
  }

  res.status(400).json({ success: false, error: 'Unknown syntax type. Supported: spss, r, python' });
});

// Seed simulation responses for researcher testing
apiApp.post('/api/admin/seed-simulation', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const countPerGroup = Math.min(250, Math.max(1, Number(req.body.countPerGroup) || 100));
    const result = await seedSimulationResponses(countPerGroup);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Simulation seed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete single response
apiApp.delete('/api/admin/response/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID phản hồi không hợp lệ' });
    }
    const result = await deleteResponseById(id);
    res.json(result);
  } catch (error: any) {
    console.error('Delete response error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete multiple responses in batch
apiApp.post('/api/admin/responses/delete-batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Danh sách ID không hợp lệ' });
    }
    const result = await deleteResponsesBatch(ids.map(Number));
    res.json(result);
  } catch (error: any) {
    console.error('Delete batch responses error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Purge / reset experimental data
apiApp.post('/api/admin/reset', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await resetExperimentData();
    res.json(result);
  } catch (error: any) {
    console.error('Reset experiment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
apiApp.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});
