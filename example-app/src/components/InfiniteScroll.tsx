import { Box } from '@mui/material'
import { JSX, useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounceCallback, useEventListener } from 'usehooks-ts'

const DEFAULT_RESIZE_DEBOUNCE_MS = 1000
const DEFAULT_ESTIMATED_ROW_HEIGHT = 16

interface InfiniteScrollProps<T, F, S> {
    headerHeight?: number,
    renderRow: (row: T, idx?: number) => JSX.Element,
    fetchData: (pageSize: number, loadedCnt: number, filterModel?: F, sortModel?: S) => Promise<{ rows: T[], error: boolean }>,
    filterModel?: F,
    sortModel?: S,

    /** use smaller value that a row can assume to avoid lock new loads */
    estimatedRowHeight?: number,
    resizeDebounceMs?: number,

    onPageSizeChanged?: (pageSize: number) => void,
    onItemsChanged?: (items: T[]) => void,
    onLoadingChanged?: (loading: boolean) => void,
    onAvailHeightChanged?: (availHeight: number) => void
}

export function InfiniteScroll<T, F, S>(props: InfiniteScrollProps<T, F, S>) {
    const [loadItemsTill, setLoadItemsTill] = useState(0)
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(false)
    const [pageSize, setPageSize] = useState(0)
    const [noMoreData, setNoMoreData] = useState(false)
    const [initialLoadFired, setInitialLoadFired] = useState(false)
    const [availHeight, setAvailHeight] = useState(0)

    const {
        headerHeight,
        renderRow,
        fetchData,
        estimatedRowHeight,
        resizeDebounceMs,
        filterModel,
        sortModel,

        onPageSizeChanged,
        onItemsChanged,
        onLoadingChanged,
        onAvailHeightChanged
    } = props

    useEffect(() => onPageSizeChanged?.(pageSize), [pageSize])
    useEffect(() => onItemsChanged?.(items), [items])
    useEffect(() => onLoadingChanged?.(loading), [loading])
    useEffect(() => onAvailHeightChanged?.(availHeight), [availHeight])

    useEffect(() => {
        if (noMoreData || loading || items.length >= loadItemsTill) return

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

                    if (q.rows.length === 0) {
                        setNoMoreData(true)
                        break;
                    }

                    else {
                        newItems = [...newItems, ...q.rows]

                        loadedCnt += q.rows.length
                    }
                }

                if (!loadErr) {
                    setItems(newItems)
                }
            }

            finally {
                setLoading(false)
            }
        }

        loadItems()
    }, [noMoreData, loading, items, loadItemsTill, pageSize, filterModel, sortModel])

    useMemo(() => {
        if (pageSize > 0 && !initialLoadFired && loadItemsTill > 0) {
            setInitialLoadFired(true)
            setLoadItemsTill(pageSize)
        }
    }, [initialLoadFired, pageSize, loadItemsTill])

    const evalLoadMore = useCallback(() => {
        if (!noMoreData && !loading && loadItemsTill > 0) {
            const scrollMore = document.body.scrollHeight - window.scrollY < window.innerHeight

            if (scrollMore) {
                setLoadItemsTill(prevCnt => prevCnt + pageSize + 1)
            }
        }
    }, [loadItemsTill, items, pageSize])

    //
    // reset items on filter debounce
    //
    useMemo(() => {
        if (pageSize > 0) {
            setInitialLoadFired(false)
            setNoMoreData(false)
            setItems([])
            setLoadItemsTill(pageSize)
            evalLoadMore()
        }
    }, [filterModel, sortModel])

    //
    // handle scroll
    //
    useEventListener('scroll', evalLoadMore)

    const recomputePageSize = () => {
        let h = window.innerHeight - (headerHeight ?? 0)
        const ps = Math.ceil(h / (estimatedRowHeight === undefined ? DEFAULT_ESTIMATED_ROW_HEIGHT : estimatedRowHeight))

        setAvailHeight(h)
        setPageSize(ps)
    }

    //
    // infer page size from available window height
    //
    useEffect(() => {
        if (headerHeight !== undefined)
            recomputePageSize()
    }, [headerHeight])

    //
    // eval pageSize extended due to resize
    //
    useEffect(() => {
        if (pageSize > loadItemsTill)
            setLoadItemsTill(pageSize + 1)
    }, [pageSize])

    //
    // handle resize
    //    
    const debounceResize = useDebounceCallback(() => {
        recomputePageSize()
    }, resizeDebounceMs === undefined ? DEFAULT_RESIZE_DEBOUNCE_MS : resizeDebounceMs)

    useEffect(() => {
        window.addEventListener('resize', debounceResize)
        return () => window.removeEventListener('resize', debounceResize)
    }, [])

    return items.map((item, itemIdx) => renderRow(item, itemIdx))
}