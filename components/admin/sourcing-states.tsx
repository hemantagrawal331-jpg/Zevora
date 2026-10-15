import { Container } from "@/components/container";
import { SourcingHeader } from "@/components/admin/sourcing-header";

export function SourcingSkeleton() {
  return (
    <Container className="py-12">
      <div className="h-10 w-48 bg-sand" />
      <div className="mt-10 space-y-4">
        <div className="h-20 bg-sand" />
        <div className="h-20 bg-sand" />
        <div className="h-20 bg-sand" />
      </div>
      <p className="sr-only">Loading sourcing records</p>
    </Container>
  );
}

export function SourcingConfigMessage() {
  return (
    <Container className="py-12">
      <SourcingHeader title="Sourcing" />
      <p className="mt-8 max-w-xl text-sm leading-6 text-charcoal">
        Set DATABASE_URL, then run npm run db:migrate. Sourcing records are stored only in that database.
      </p>
    </Container>
  );
}

export function SourcingStorageMessage() {
  return (
    <Container className="py-12">
      <SourcingHeader title="Sourcing" />
      <p className="mt-8 max-w-xl text-sm leading-6" role="alert">
        Sourcing storage could not be reached. Confirm DATABASE_URL and that the migration has been applied.
      </p>
    </Container>
  );
}
