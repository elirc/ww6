import { PrismaClient, Role, BudgetTargetType, AnomalySeverity } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const acme = await prisma.tenant.upsert({
    where: { id: "tenant_acme" },
    update: {},
    create: { id: "tenant_acme", name: "Acme Corp" }
  });

  const beta = await prisma.tenant.upsert({
    where: { id: "tenant_beta" },
    update: {},
    create: { id: "tenant_beta", name: "Beta Logistics" }
  });

  const [acmeAdmin] = await Promise.all([
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: acme.id, email: "admin@acme.dev" } },
      update: {},
      create: {
        tenantId: acme.id,
        email: "admin@acme.dev",
        name: "Acme Admin",
        role: Role.PLATFORM_ADMIN
      }
    })
  ]);

  const acmeTeam = await prisma.team.upsert({
    where: { id: "team_acme_finops" },
    update: {},
    create: {
      id: "team_acme_finops",
      tenantId: acme.id,
      name: "FinOps",
      costCenter: "CC-100"
    }
  });

  const acmeProject = await prisma.project.upsert({
    where: { id: "project_acme_observability" },
    update: {},
    create: {
      id: "project_acme_observability",
      tenantId: acme.id,
      teamId: acmeTeam.id,
      name: "Observability Platform",
      costCenter: "CC-100-OBS"
    }
  });

  await prisma.costLineItem.createMany({
    data: [
      {
        tenantId: acme.id,
        projectId: acmeProject.id,
        cloudProvider: "aws",
        externalResourceId: "i-001",
        service: "EC2",
        usageDate: new Date("2026-03-02"),
        amount: 2500.2,
        currency: "USD",
        tags: { team: "FinOps", project: "Observability Platform", env: "prod" },
        source: "seed"
      },
      {
        tenantId: acme.id,
        projectId: acmeProject.id,
        cloudProvider: "aws",
        externalResourceId: "db-001",
        service: "RDS",
        usageDate: new Date("2026-03-03"),
        amount: 1100.0,
        currency: "USD",
        tags: { team: "FinOps", project: "Observability Platform", env: "prod" },
        source: "seed"
      },
      {
        tenantId: beta.id,
        cloudProvider: "azure",
        externalResourceId: "vm-221",
        service: "VM",
        usageDate: new Date("2026-03-04"),
        amount: 555.5,
        currency: "USD",
        tags: { team: "Operations", project: "Tracking" },
        source: "seed"
      }
    ],
    skipDuplicates: true
  });

  await prisma.allocationRule.create({
    data: {
      tenantId: acme.id,
      name: "Route FinOps Tag",
      matchTagKey: "team",
      matchTagValue: "FinOps",
      weightPercent: 100,
      targetTeamId: acmeTeam.id,
      targetProjectId: acmeProject.id
    }
  });

  await prisma.budget.create({
    data: {
      tenantId: acme.id,
      targetType: BudgetTargetType.PROJECT,
      projectId: acmeProject.id,
      monthStart: new Date("2026-03-01"),
      amount: 5000,
      alertThresholdPct: 90
    }
  });

  const costItem = await prisma.costLineItem.findFirstOrThrow({ where: { tenantId: acme.id } });
  await prisma.anomaly.create({
    data: {
      tenantId: acme.id,
      costLineItemId: costItem.id,
      severity: AnomalySeverity.MEDIUM,
      expectedAmount: 1400,
      actualAmount: 2500.2,
      message: "EC2 spend exceeded expected trend by > 70%"
    }
  });

  console.log("Seed complete", { adminUserId: acmeAdmin.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
