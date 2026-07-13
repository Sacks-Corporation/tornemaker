import Skeleton from './Skeleton'
import type { SkeletonProps } from './Skeleton'

// Componente puramente presentacional: el container reenvía las props tal cual.
function SkeletonContainer(props: SkeletonProps) {
  return <Skeleton {...props} />
}

export default SkeletonContainer
export type { SkeletonProps }
