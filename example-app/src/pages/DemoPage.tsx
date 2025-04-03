import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useEffect, useRef, useState } from 'react'
import { Box, Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, useTheme } from '@mui/material'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<any>(null)
  const theme = useTheme()
  const [filter, setFilter] = useState("")
  const [debouncedFilter, setDebouncedFilter] = useDebounceValue("", 250)  
  const [loading, setLoading] = useState<boolean>(false)
  const [items, setItems] = useState<DataSampleType[]>([])
  const [pageSize, setPageSize] = useState(0)
  const [filterModel, setFilterModel] = useState<DemoFilterModel | undefined>(undefined)
  const [sortModel, setSortModel] = useState<DemoSortModel | undefined>(undefined)

  useEffect(() => {
    document.title = `${APP_TITLE} - Test`
  }, [])

  useEffect(() => {
    setFilterModel({
      filter: debouncedFilter
    })
  }, [debouncedFilter])

  return <Box>

    {/* HEADER SEARCH */}
    <Box

      sx={{
        width: '100%',
        background: theme.palette.background.default,
        mt: DEFAULT_SIZE_1_REM,
        mb: DEFAULT_SIZE_1_REM        
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
    <Box
      ref={containerRef}
      sx={{
        border: '1px solid yellow',
        overflowY: 'scroll'
      }}>

      <Table>

        <TableHead
          ref={headerRef}
          sx={{
            position: 'sticky',
            top: 0,
            background: '#202020'
          }}>
          <TableRow>
            <TableCell>id</TableCell>
            <TableCell>data</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          <InfiniteScroll<DataSampleType, DemoFilterModel, DemoSortModel>
            containerRef={containerRef}
            headerRef={headerRef}
            containerFit
            filterModel={filterModel}
            sortModel={sortModel}
            estimatedRowHeight={50}

            renderRow={(row, rowIdx) => <TableRow key={`row-${rowIdx}`} sx={{
              m: DEFAULT_SIZE_1_REM,
              p: DEFAULT_SIZE_1_REM
            }}>
              <TableCell>
                <Typography>{row.id}</Typography>
              </TableCell>

              <TableCell>
                <Typography>{row.text}</Typography>
              </TableCell>
            </TableRow>}

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
            onPageSizeChanged={x => setPageSize(x)}
          />
        </TableBody>

      </Table>

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
