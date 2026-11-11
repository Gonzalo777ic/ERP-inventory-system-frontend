import { httpStore } from "../httpStore";
import {
  CRM_OPPORTUNITY_FIXTURES,
  CRM_PIPELINE_FIXTURE,
} from "../../data/crmFixtures";
import type {
  CrmOpportunityDto,
  CrmPipelineDto,
  CrmPipelineStageDto,
} from "../../types/crm";

const MOCK_LATENCY_MS = 160;
const CRM_QUERY_STALE_MS = 60_000;

export const crmQueryKeys = {
  all: ["crm"] as const,
  stages: () => [...crmQueryKeys.all, "stages"] as const,
  pipeline: () => [...crmQueryKeys.all, "pipeline"] as const,
  opportunities: () => [...crmQueryKeys.all, "opportunities"] as const,
  opportunity: (id: number) =>
    [...crmQueryKeys.opportunities(), id] as const,
};

export { CRM_QUERY_STALE_MS };

/** Mutable mock store so kanban stage moves persist in-session. */
let mockOpportunities: CrmOpportunityDto[] = CRM_OPPORTUNITY_FIXTURES.map(
  (o) => ({
    ...o,
    expectedRevenue: { ...o.expectedRevenue },
  }),
);

function storeApiBase(): string | null {
  const base = import.meta.env.VITE_STORE_API_URL;
  if (!base || typeof base !== "string" || base.trim() === "") {
    return null;
  }
  return base.replace(/\/$/, "");
}

function crmUrl(suffix: string): string {
  const base = storeApiBase();
  if (!base) {
    throw new Error("VITE_STORE_API_URL no configurada.");
  }
  return `${base}/crm${suffix}`;
}

/** Demo default: fixtures when no store URL, or when VITE_CRM_USE_MOCK=true. */
export function crmUseMock(): boolean {
  if (import.meta.env.VITE_CRM_USE_MOCK === "true") return true;
  if (import.meta.env.VITE_CRM_USE_MOCK === "false" && storeApiBase()) {
    return false;
  }
  return !storeApiBase();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function activeStagesFromPipeline(pipeline: CrmPipelineDto): CrmPipelineStageDto[] {
  return pipeline.stages
    .filter((s) => s.deletedAt == null)
    .slice()
    .sort((a, b) => a.sequenceNo - b.sequenceNo)
    .map((s) => ({ ...s }));
}

async function mockPipeline(): Promise<CrmPipelineDto> {
  await delay(MOCK_LATENCY_MS);
  return {
    ...CRM_PIPELINE_FIXTURE,
    stages: activeStagesFromPipeline(CRM_PIPELINE_FIXTURE),
  };
}

async function mockStages(): Promise<CrmPipelineStageDto[]> {
  const pipeline = await mockPipeline();
  return pipeline.stages;
}

function cloneOpportunity(o: CrmOpportunityDto): CrmOpportunityDto {
  return {
    ...o,
    expectedRevenue: { ...o.expectedRevenue },
  };
}

export const CrmService = {
  isMockMode: crmUseMock,

  /**
   * Active pipeline stages — SoT for kanban column titles (never hardcode in UI).
   */
  listStages: async (): Promise<CrmPipelineStageDto[]> => {
    if (crmUseMock()) {
      return mockStages();
    }
    try {
      const { data } = await httpStore.get<CrmPipelineStageDto[]>(
        crmUrl("/pipelines/default/stages"),
      );
      return data
        .filter((s) => s.deletedAt == null)
        .slice()
        .sort((a, b) => a.sequenceNo - b.sequenceNo);
    } catch {
      return mockStages();
    }
  },

  getDefaultPipeline: async (): Promise<CrmPipelineDto> => {
    if (crmUseMock()) {
      return mockPipeline();
    }
    try {
      const { data } = await httpStore.get<CrmPipelineDto>(
        crmUrl("/pipelines/default"),
      );
      return {
        ...data,
        stages: activeStagesFromPipeline(data),
      };
    } catch {
      return mockPipeline();
    }
  },

  listOpportunities: async (): Promise<CrmOpportunityDto[]> => {
    if (crmUseMock()) {
      await delay(MOCK_LATENCY_MS);
      return mockOpportunities.map(cloneOpportunity);
    }
    try {
      const { data } = await httpStore.get<CrmOpportunityDto[]>(
        crmUrl("/opportunities"),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      return mockOpportunities.map(cloneOpportunity);
    }
  },

  getOpportunity: async (id: number): Promise<CrmOpportunityDto> => {
    if (crmUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const found = mockOpportunities.find((o) => o.id === id);
      if (!found) {
        throw new Error("Oportunidad no encontrada.");
      }
      return cloneOpportunity(found);
    }
    try {
      const { data } = await httpStore.get<CrmOpportunityDto>(
        crmUrl(`/opportunities/${id}`),
      );
      return data;
    } catch {
      await delay(MOCK_LATENCY_MS);
      const found = mockOpportunities.find((o) => o.id === id);
      if (!found) {
        throw new Error("Oportunidad no encontrada.");
      }
      return cloneOpportunity(found);
    }
  },

  /**
   * Moves an open opportunity to another pipeline stage (mock persists in-memory).
   */
  moveOpportunity: async (
    opportunityId: number,
    stageId: number,
  ): Promise<CrmOpportunityDto> => {
    if (crmUseMock()) {
      await delay(MOCK_LATENCY_MS);
      const stages = activeStagesFromPipeline(CRM_PIPELINE_FIXTURE);
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) {
        throw new Error("Etapa no encontrada en el pipeline.");
      }
      const idx = mockOpportunities.findIndex((o) => o.id === opportunityId);
      if (idx < 0) {
        throw new Error("Oportunidad no encontrada.");
      }
      const current = mockOpportunities[idx];
      if (current.status !== "OPEN") {
        throw new Error("Solo se mueven oportunidades abiertas.");
      }

      let nextStatus = current.status;
      let closedAt = current.closedAt;
      if (stage.outcome === "WON") {
        nextStatus = "WON";
        closedAt = new Date().toISOString();
      } else if (stage.outcome === "LOST") {
        nextStatus = "LOST";
        closedAt = new Date().toISOString();
      }

      const updated: CrmOpportunityDto = {
        ...current,
        stageId,
        status: nextStatus,
        closedAt,
        expectedRevenue: { ...current.expectedRevenue },
      };
      mockOpportunities = [
        ...mockOpportunities.slice(0, idx),
        updated,
        ...mockOpportunities.slice(idx + 1),
      ];
      return cloneOpportunity(updated);
    }

    try {
      const { data } = await httpStore.post<CrmOpportunityDto>(
        crmUrl(`/opportunities/${opportunityId}/move`),
        { stageId },
      );
      return data;
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("No se pudo mover la oportunidad.");
    }
  },
};
