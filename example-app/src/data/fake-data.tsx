import { from, NumberComparer } from "linq-to-typescript"
import { delay } from "../util/util"

export interface DataSampleType {
    id: number,
    text: string
}

const FAKE_DATA_CNT = 200
const FAKE_DELAY_MS = 250

const dataRepository: DataSampleType[] = []

const ensureData = () => {
    if (dataRepository.length === 0) {
        for (let i = 0; i < FAKE_DATA_CNT; ++i) {
            dataRepository.push({
                id: i + 1,
                text: `sample data nr. ${i + 1}`
            })
        }
    }
}

export const fakeDataFetcherApi = async (off: number, cnt: number, filter: string, sortAsc: boolean) => {
    ensureData()

    await delay(FAKE_DELAY_MS)

    console.log(`===> LOAD off:${off} cnt:${cnt} filter:${filter}`)

    const filterToLower = filter.toLowerCase()

    let q = from(dataRepository)
        .where(x => x.text.toLowerCase().indexOf(filterToLower) !== -1)        

    if (sortAsc)
        q = q.orderBy(w => w.id, NumberComparer)
    else
        q = q.orderByDescending(w => w.id, NumberComparer)

    return q
        .skip(off)
        .take(cnt)
        .toArray()
}