import { Container } from "@/components/container";

export function CatalogSkeleton() {
  return (
    <Container className="py-12">
      <div className="h-10 w-48 bg-sand" />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-[3/4] animate-pulse bg-sand" />
            <div className="mt-3 h-4 w-2/3 bg-sand" />
            <div className="mt-2 h-3 w-1/3 bg-sand" />
          </div>
        ))}
      </div>
    </Container>
  );
}
