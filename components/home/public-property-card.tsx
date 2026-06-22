import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building2, Home, Hotel, MapPin, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  publicImmovableAddressLabel,
  publicImmovableDetailPath,
  publicImmovableHighlights,
  publicImmovableImage,
  publicImmovablePriceLabel,
  publicImmovableReferenceLabel,
  publicImmovableStatusLabel,
  publicImmovableTitle,
  publicImmovableTransactionLabel,
  publicImmovableType,
  publicImmovableTypeLabel,
  type PublicImmovable,
} from "@/lib/public-immovables"

function PropertyIcon({ type }: { type?: string | null }) {
  const className = "size-8"

  if (type === "hotel") {
    return <Hotel className={className} />
  }

  if (type === "kiosque") {
    return <Store className={className} />
  }

  if (type === "maison" || type === "appartement") {
    return <Home className={className} />
  }

  return <Building2 className={className} />
}

function PublicResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function PublicPropertyCard({ property }: { property: PublicImmovable }) {
  const detailPath = publicImmovableDetailPath(property)
  const image = publicImmovableImage(property)
  const highlights = publicImmovableHighlights(property)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary text-primary">
        {image ? (
          <Image
            src={image}
            alt={publicImmovableTitle(property)}
            fill
            unoptimized
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#e9f8ff,#ffffff)]">
            <PropertyIcon type={publicImmovableType(property)} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-brand-navy/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            {publicImmovableTypeLabel(property)}
          </span>
          <span className="rounded-md bg-brand-orange px-2 py-1 text-xs font-semibold text-brand-navy">
            {publicImmovableTransactionLabel(property)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            <span>{publicImmovableReferenceLabel(property)}</span>
            <span className="rounded-md bg-muted px-2 py-1 text-foreground">
              {publicImmovableStatusLabel(property)}
            </span>
          </div>
          <h2 className="line-clamp-2 text-lg leading-snug font-semibold">
            {publicImmovableTitle(property)}
          </h2>
          <p className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="line-clamp-2">
              {publicImmovableAddressLabel(property)}
            </span>
          </p>
        </div>

        {highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-lg font-semibold text-primary">
            {publicImmovablePriceLabel(property)}
          </p>
          {detailPath ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={detailPath}>
                Voir
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { PublicPropertyCard, PublicResultsSkeleton }
