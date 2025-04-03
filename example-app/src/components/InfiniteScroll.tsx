import { JSX, RefObject, useEffect, useMemo, useState } from 'react'

const DEFAULT_ESTIMATED_ROW_HEIGHT = 16

interface InfiniteScrollProps<T, F, S> {
    containerRef: RefObject<HTMLDivElement | null>,
    headerRef: RefObject<any>,
    containerFit?: boolean,

    renderRow: (row: T, idx?: number) => JSX.Element,
    fetchData: (pageSize: number, loadedCnt: number, filterModel?: F, sortModel?: S) => Promise<{ rows: T[], error: boolean }>,
    filterModel?: F,
    sortModel?: S,

    /** use smaller value that a row can assume to avoid lock new loads */
    estimatedRowHeight?: number,

    onPageSizeChanged?: (pageSize: number) => void,
    onItemsChanged?: (items: T[]) => void,
    onLoadingChanged?: (loading: boolean) => void,
}

export function InfiniteScroll<T, F, S>(props: InfiniteScrollProps<T, F, S>) {
    const [loadItemsTill, setLoadItemsTill] = useState(0)
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [pageSize, setPageSize] = useState(0)
    const [noMoreData, setNoMoreData] = useState(false)
    const [initialLoadFired, setInitialLoadFired] = useState(false)
    const [loadErr, setLoadErr] = useState(false)
    const [lastScrollTop, setLastScrollTop] = useState(0)

    const {
        containerRef,
        headerRef,
        containerFit,
        renderRow,
        fetchData,
        estimatedRowHeight,
        filterModel,
        sortModel,

        onPageSizeChanged,
        onItemsChanged,
        onLoadingChanged
    } = props

    useEffect(() => onPageSizeChanged?.(pageSize), [pageSize])
    useEffect(() => onItemsChanged?.(items), [items])
    useEffect(() => onLoadingChanged?.(loading), [loading])

    useEffect(() => {
        if (loadErr || noMoreData || loading || items.length >= loadItemsTill) return

        setLoading(true)

        const loadItems = async () => {
            try {
                let loadedCnt = items.length
                let newItems = [...items]
                let loadErr = false

                while (loadedCnt < loadItemsTill) {

                    const q = await fetchData(pageSize, loadedCnt, filterModel, sortModel)

                    if (q.error) {
                        loadErr = true
                        break
                    }

                    newItems = [...newItems, ...q.rows]

                    loadedCnt += q.rows.length

                    if (q.rows.length < pageSize) {
                        setNoMoreData(true)
                        break;
                    }
                }

                if (!loadErr)
                    setItems(newItems)

                else
                    setLoadErr(true)
            }

            finally {
                setLoading(false)
            }
        }

        loadItems()
    }, [noMoreData, loading, items, loadItemsTill, pageSize, filterModel, sortModel])

    //
    // initial load
    //
    useMemo(() => {
        if (pageSize > 0 && !initialLoadFired && loadItemsTill > 0) {
            setInitialLoadFired(true)
            setLoadItemsTill(pageSize)
        }
    }, [initialLoadFired, pageSize, loadItemsTill])

    //
    // reset items on filter debounce
    //
    useMemo(() => {
        if (pageSize > 0) {
            // console.log(`****reset status`)            
            setLastScrollTop(0)
            setInitialLoadFired(false)
            setNoMoreData(false)
            setItems([])
            setLoadItemsTill(pageSize)
        }
    }, [filterModel, sortModel])

    //
    // recompute page size helper method
    //    
    const recomputePageSize = () => {
        const ch = (containerRef?.current?.clientHeight ?? window.innerHeight)
        const hh = (headerRef?.current?.clientHeight ?? 0)
        let height = ch - hh

        const ps = Math.ceil(height / (estimatedRowHeight === undefined ? DEFAULT_ESTIMATED_ROW_HEIGHT : estimatedRowHeight))

        setPageSize(ps)
    }

    //
    // eval pageSize extended due to resize
    //
    useEffect(() => {
        if (pageSize > loadItemsTill)
            setLoadItemsTill(pageSize + 1)
    }, [pageSize, loadItemsTill])

    //
    // handle scroll
    //         
    useEffect(() => {
        if (pageSize === 0) {

            if (containerFit && containerRef.current) {
                const element = containerRef.current

                const h = window.innerHeight - (element.offsetTop ?? 0) - 16

                element.style.height = `${h}px`
            }

            recomputePageSize()
        }

        const evalScroll = () => {
            if (containerRef.current) {
                const element = containerRef.current
                if (element.scrollTop < lastScrollTop) return

                setLastScrollTop(element.scrollTop <= 0 ? 0 : element.scrollTop)
                if (element.scrollTop + element.offsetHeight >= element.scrollHeight) {
                    setLoadItemsTill(prev => prev + pageSize)
                }
            }
        }

        containerRef.current?.addEventListener('scroll', evalScroll)
        return () => {
            containerRef.current?.removeEventListener('scroll', evalScroll)
        }
    }, [containerRef, loadItemsTill])

    const windowResized = () => {
        if (containerFit && containerRef.current) {
            const h = window.innerHeight - (containerRef.current?.offsetTop ?? 0) - 16

            const element = containerRef.current
            element.style.height = `${h}px`

            recomputePageSize()
        }
    }

    useEffect(() => {
        window.addEventListener('resize', windowResized)
        return () => window.removeEventListener('resize', windowResized)
    }, [])

    return items.map((item, itemIdx) => renderRow(item, itemIdx))
}