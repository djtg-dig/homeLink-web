import Image from "next/image"

import { cn } from "@/lib/utils"

function HomelinkLogo({
  className,
  priority = false,
  sizes,
}: {
  className?: string
  priority?: boolean
  sizes: string
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src="/logo_loyer360_transparent.png"
        alt="Loyer360"
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover [object-position:center_45%]"
      />
    </div>
  )
}

export { HomelinkLogo }
