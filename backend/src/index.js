import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { traceMiddleware } from './middleware/trace.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerFsRoutes } from './routes/fs.js';
import { registerChatRoutes } from './routes/chat.js';
import { registerTemplateRoutes } from './routes/templates.js';
import { registerValidationRoutes } from './routes/validate.js';
import { registerGovernorRoutes } from './routes/governor.js';
import { registerTelephonyRoutes } from './routes/telephony.js';
import { registerConnectorRoutes } from './routes/connectors.js';
import { registerRagRoutes } from './routes/rag.js';
import { registerBrowserRoutes } from './routes/browser.js';
import { registerAutoMlRoutes } from './routes/automl.js';
import { registerQxbRoutes } from './routes/qxb.js';
import { registerOpsRoutes } from './routes/ops.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAiIntegrationRoutes } from './routes/ai-integration.js';
import { registerNlcRoutes } from './routes/nlc.js';
import { initDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(traceMiddleware);

registerHealthRoutes(app);
app.use('/api', requireAuth);
registerFsRoutes(app);
registerChatRoutes(app);
registerTemplateRoutes(app);
registerValidationRoutes(app);
registerGovernorRoutes(app);
registerTelephonyRoutes(app);
registerConnectorRoutes(app);
registerRagRoutes(app);
registerBrowserRoutes(app);
registerAutoMlRoutes(app);
registerQxbRoutes(app);
registerOpsRoutes(app);
registerAdminRoutes(app);
registerAiIntegrationRoutes(app);
registerNlcRoutes(app);

await initDb();

app.listen(config.port, () => {
  console.log(`Vizual-X backend listening on ${config.port}`);
  console.log(`Workspace root: ${config.workspaceRoot}`);
});
