import { IQueryInsert, IQuerySelect, IQueryUpdate, PG_PromiseType } from "../types";
import { supabase } from "./database";

export class DatabaseQueries {
    private sb = supabase()
    private prefix = 'chat_app_'

    select(queryObject: IQuerySelect): PG_PromiseType {
        // select data
        const selectAllDataFromDB = async () => {
            // default limit
            let [rangeMin, rangeMax]: [number, number] = [0, 50]
            // if there's limit property in query object
            if(queryObject.limit) {
                const { min, max } = queryObject.limit
                // update rangeMin and rangeMax
                rangeMin = min; rangeMax = max
            }
            // run query 
            if(queryObject.function) {
                // run function
                const {data, error} = await this.sb.rpc(queryObject.function) 
                return {data: data, error: error}
            }
            else if(queryObject.whereColumn) {
                // where condition
                const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                    .select(queryObject.selectColumn as string) // select columns
                                    .eq(queryObject.whereColumn as string, queryObject.whereValue) // where condition
                                    .range(rangeMin, rangeMax) // limit, how many data will be retrieved
                                    .order('id', {ascending: true}) // order data by..
                return {data: data, error: error}
            }
            else {
                const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                    .select(queryObject.selectColumn as string) // select columns
                                    .range(rangeMin, rangeMax) // limit, how many data will be retrieved
                                    .order('id', {ascending: true}) // order data by..
                return {data: data, error: error}
            }
        }
        return selectAllDataFromDB()
    }

    insert(queryObject: IQueryInsert): PG_PromiseType {
        // insert data 
        const insertDataToDB = async () => {
            // run query
            const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                .insert(queryObject.insertColumn)
                                .select(queryObject.selectColumn as string)
            return {data: data, error: error}
        }
        return insertDataToDB()
    }

    update(queryObject: IQueryUpdate): PG_PromiseType {
        // update data
        const updateDataToDB = async () => {
            // run query
            const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                .update(queryObject.updateColumn)
                                .eq(queryObject.whereColumn, queryObject.whereValue)
                                .select(queryObject.selectColumn as string)
            return {data: data, error: error}
        }
        return updateDataToDB()
    }
}