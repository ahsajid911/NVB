import { specialtiesRepo } from "@/lib/repositories/specialties.repo";
import { withErrorHandler } from "@/lib/middleware/errorHandler";
import { success } from "@/lib/utils/apiResponse";

export const GET = withErrorHandler(async () => {
  const data = await specialtiesRepo.findAll();
  return success(data);
});
