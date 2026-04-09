import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../common/errors.js";
import { requireAdmin } from "../../lib/require-admin.js";
import {
  adminReportPatchSchema,
  adminReportsQuerySchema,
  adminUserPatchSchema,
  adminUsersQuerySchema,
  adminVideoModerationPatchSchema,
} from "./admin.schemas.js";
import {
  getAdminVideoDetail,
  listAdminReports,
  listAdminVideosModeration,
  listModerationActions,
  patchAdminReport,
  patchAdminVideoModeration,
} from "./admin-moderation.service.js";
import {
  adminUpdateUser,
  getAdminStats,
  listAdminUsers,
} from "./admin.service.js";

type UserIdParams = { Params: { userId: string } };
type ReportIdParams = { Params: { reportId: string } };
type VideoIdParams = { Params: { videoId: string } };

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get(
    "/v1/admin/stats",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const stats = await getAdminStats();
        void reply.send(stats);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/admin/users",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const q = adminUsersQuerySchema.parse(request.query);
        const result = await listAdminUsers(q.cursor, q.limit);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.patch<UserIdParams>(
    "/v1/admin/users/:userId",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const body = adminUserPatchSchema.parse(request.body);
        const actorId = request.currentUser!.id;
        const updated = await adminUpdateUser(actorId, request.params.userId, {
          role: body.role,
          status: body.status,
        });
        void reply.send({ user: updated });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/admin/reports",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const q = adminReportsQuerySchema.parse(request.query);
        const result = await listAdminReports(q.cursor, q.limit, q.status);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.patch<ReportIdParams>(
    "/v1/admin/reports/:reportId",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const body = adminReportPatchSchema.parse(request.body);
        const actorId = request.currentUser!.id;
        const updatedReport = await patchAdminReport(
          actorId,
          request.params.reportId,
          body.status,
          body.notes,
        );
        void reply.send({ report: updatedReport });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/admin/videos/moderation",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const q = adminUsersQuerySchema.parse(request.query);
        const result = await listAdminVideosModeration(q.cursor, q.limit);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get<VideoIdParams>(
    "/v1/admin/videos/:videoId",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const result = await getAdminVideoDetail(request.params.videoId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.patch<VideoIdParams>(
    "/v1/admin/videos/:videoId/moderation",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const body = adminVideoModerationPatchSchema.parse(request.body);
        const actorId = request.currentUser!.id;
        const video = await patchAdminVideoModeration(
          actorId,
          request.params.videoId,
          body.moderationState,
          body.notes,
        );
        void reply.send({ video });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/admin/moderation-actions",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const q = adminUsersQuerySchema.parse(request.query);
        const result = await listModerationActions(q.cursor, q.limit);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
