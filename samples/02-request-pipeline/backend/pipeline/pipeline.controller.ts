import "reflect-metadata";
import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
} from "next-js-backend";
import { RolesGuard } from "./roles.guard";
import { TimingInterceptor } from "./timing.interceptor";
import { ParseIntPipe } from "./parse-int.pipe";

@Controller("/pipeline")
export class PipelineController {
  @Get("/public")
  @UseInterceptors(TimingInterceptor)
  getPublic() {
    return { message: "Public route — no guard", user: "anonymous" };
  }

  /** GET /api/pipeline/admin?role=admin — RolesGuard blocks unless ?role=admin */
  @Get("/admin")
  @UseGuards(RolesGuard)
  @UseInterceptors(TimingInterceptor)
  getAdmin() {
    return { message: "Admin-only route — RolesGuard passed ✅" };
  }

  /**
   * GET /api/pipeline/items/:id
   * ParseIntPipe is applied manually inside the handler (Param decorator only accepts TSchema as 2nd arg)
   */
  @Get("/items/:id")
  @UseInterceptors(TimingInterceptor)
  getItem(@Param("id") rawId: string) {
    const pipe = new ParseIntPipe();
    const id = pipe.transform(rawId, { type: "param", metatype: Number });
    return {
      id,
      label: `Item #${id}`,
      note: "ParseIntPipe validated the string param",
    };
  }

  /** GET /api/pipeline/items/abc — triggers BadRequestException from ParseIntPipe */
  @Get("/bad")
  @UseInterceptors(TimingInterceptor)
  getBad() {
    const pipe = new ParseIntPipe();
    const id = pipe.transform("abc", { type: "param", metatype: Number });
    return { id };
  }
}
