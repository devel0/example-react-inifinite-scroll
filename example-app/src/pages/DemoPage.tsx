import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useEffect, useRef, useState } from 'react'
import { Box, Button, CircularProgress, TextField, Typography, useTheme } from '@mui/material'
import { APP_TITLE, DEFAULT_SIZE_0_5_REM, DEFAULT_SIZE_1_REM } from '../constants/gui'
import { useDebounceValue } from 'usehooks-ts';
import { InfiniteScroll } from '../components/InfiniteScroll';
import { DataSampleType, fakeDataFetcherApi } from '../data/fake-data';

interface DemoFilterModel {
  filter: string
}

interface DemoSortModel {
  modeAsc: boolean
}

export const DemoPage = () => {
  const headerRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()
  const [filter, setFilter] = useState("")
  const [debouncedFilter, setDebouncedFilter] = useDebounceValue("", 250)
  const [headerHeight, setHeaderHeight] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [items, setItems] = useState<DataSampleType[]>([])
  const [availHeight, setAvailHeight] = useState<number>(0)
  const [pageSize, setPageSize] = useState(0)
  const [filterModel, setFilterModel] = useState<DemoFilterModel | undefined>(undefined)
  const [sortModel, setSortModel] = useState<DemoSortModel | undefined>(undefined)

  useEffect(() => {
    document.title = `${APP_TITLE} - Test`
  }, [])

  //
  // infer page size from available window height
  //
  useEffect(() => {
    if (headerRef.current) {
      const h = headerRef.current.clientHeight
      console.log(`  ***** SETTING HEADER HEIGHT ${h}`)
      setHeaderHeight(h)
    }
  }, [headerRef])

  useEffect(() => {
    setFilterModel({
      filter: debouncedFilter
    })
  }, [debouncedFilter])

  return <Box>

    {/* HEADER SEARCH */}
    <Box
      ref={headerRef}
      sx={{
        width: '100%',
        background: theme.palette.background.default,
        position: 'fixed',
        zIndex: 1,
        top: 0, // or global.appBarHeight if any
        pt: DEFAULT_SIZE_0_5_REM,
        pb: DEFAULT_SIZE_0_5_REM
      }}>

      <Box sx={{
        display: 'flex',
        gap: DEFAULT_SIZE_0_5_REM,
      }}>

        <Box sx={{ alignSelf: 'center' }}>
          <SearchIcon fontSize='large' />
        </Box>

        <TextField
          value={filter}
          onChange={x => {
            setFilter(x.target.value)
            setDebouncedFilter(x.target.value);
          }} />

        <Box sx={{
          flexGrow: 1
        }}>
          <Box sx={{ display: 'flex' }}>
            <Box>
              <Typography>wheight:{window.innerHeight} - hHeight:{headerHeight} = {availHeight}</Typography>
              <Typography>items:{items.length} ( pageSize:{pageSize} )</Typography>
            </Box>
            <Box>
              <Button onClick={() => setSortModel({
                modeAsc: !(sortModel === undefined || sortModel?.modeAsc === true)
              })}>
                <Box>
                  <Box>
                    Sorting
                  </Box>
                  <Box>
                    {(sortModel === undefined || sortModel?.modeAsc === true) && <ArrowUpwardIcon />}
                    {(sortModel?.modeAsc === false) && <ArrowDownwardIcon />}
                  </Box>
                </Box>
              </Button>
              {/* <ArrowDownwardIcon /> */}
            </Box>
          </Box>
        </Box>

        <Box sx={{
          alignSelf: 'center',
          mr: DEFAULT_SIZE_1_REM
        }}>
          {loading && <CircularProgress sx={{ color: 'yellow' }} />}
        </Box>

      </Box>

    </Box>

    {/* INFINITE SCROLL DATA */}
    <Box sx={{
      // border: '1px solid gray',
      mt: `${headerRef.current?.clientHeight}px`
    }}>

      <InfiniteScroll<DataSampleType, DemoFilterModel, DemoSortModel>
        headerHeight={headerHeight}
        filterModel={filterModel}
        sortModel={sortModel}
        estimatedRowHeight={35}

        renderRow={row => <Box sx={{
          m: DEFAULT_SIZE_1_REM,
          p: DEFAULT_SIZE_1_REM,
          border: '1px solid darkcyan',
        }}>
          <Typography>id {row.id}: {row.text}</Typography>
        </Box>}

        fetchData={async (pageSize: number, loadedCnt: number, filterModel?: DemoFilterModel, sortModel?: DemoSortModel) => {
          let loadErr = false
          let res: DataSampleType[] = []

          try {
            const q = await fakeDataFetcherApi(loadedCnt, pageSize,
              filterModel?.filter ?? '',
              sortModel === undefined || sortModel?.modeAsc === true)

            res = q
          }

          catch (_ex) {

            loadErr = true
          }

          return { rows: res, error: loadErr }
        }}

        onLoadingChanged={x => setLoading(x)}
        onItemsChanged={x => setItems(x)}
        onAvailHeightChanged={x => setAvailHeight(x)}
        onPageSizeChanged={x => setPageSize(x)}
      />

      {loading && <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: DEFAULT_SIZE_1_REM,
      }}>
        <Typography>Loading data...</Typography>
      </Box>}
    </Box>

  </Box>
}
