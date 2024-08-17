import { IQueryInsert, IQuerySelect, IQueryUpdate, PG_PromiseType } from "../types";
import { supabase } from "./database";

export class DatabaseQueries {
    private sb = supabase()
    private prefix = 'chat_app_'

    async db_func<T>(queryObject: IQuerySelect | IQueryInsert | IQueryUpdate) {
        // order columns
        if(queryObject.order) {
            const { col, by } = queryObject.order
            const orderBy = by === 'asc' ? true : false
            // run function
            const {data, error} = queryObject.function_args
                                    // function with parameter
                                    ? await this.sb.rpc(queryObject.function, queryObject.function_args).order(col, {ascending: orderBy})
                                    // function without parameter
                                    : await this.sb.rpc(queryObject.function).order(col, {ascending: orderBy})
            return {data: data as T[], error: error}
        }
        // not order columns
        // run function
        const {data, error} = queryObject.function_args
                                // function with parameter
                                ? await this.sb.rpc(queryObject.function, queryObject.function_args)
                                // function without parameter
                                : await this.sb.rpc(queryObject.function)  
        return {data: data as T[], error: error}
    }

    select<T>(queryObject: IQuerySelect): PG_PromiseType<T> {
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
                const invokeFunction = await this.db_func<T>(queryObject)
                return invokeFunction
            }
            else if(queryObject.whereColumn) {
                // where condition
                const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                    .select(queryObject.selectColumn as string) // select columns
                                    .eq(queryObject.whereColumn as string, queryObject.whereValue) // where condition
                                    .range(rangeMin, rangeMax) // limit, how many data will be retrieved
                                    .order('id', {ascending: true}) // order data by..
                return {data: data as T[], error: error}
            }
            else {
                const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                    .select(queryObject.selectColumn as string) // select columns
                                    .range(rangeMin, rangeMax) // limit, how many data will be retrieved
                                    .order('id', {ascending: true}) // order data by..
                return {data: data as T[], error: error}
            }
        }
        return selectAllDataFromDB()
    }

    insert<T>(queryObject: IQueryInsert): PG_PromiseType<T> {
        // insert data 
        const insertDataToDB = async () => {
            // run query
            if(queryObject.function) {
                // run function
                const invokeFunction = await this.db_func<T>(queryObject)
                return invokeFunction
            }
            else {
                const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                    .insert(queryObject.insertColumn)
                                    .select(queryObject.selectColumn as string)
                return {data: data as T[], error: error}
            }
        }
        return insertDataToDB()
    }

    update<T>(queryObject: IQueryUpdate): PG_PromiseType<T> {
        // update data
        const updateDataToDB = async () => {
            // run query
            const {data, error} = await this.sb.from(this.prefix + queryObject.table)
                                .update(queryObject.updateColumn)
                                .eq(queryObject.whereColumn, queryObject.whereValue)
                                .select(queryObject.selectColumn as string)
            return {data: data as T[], error: error}
        }
        return updateDataToDB()
    }

    /**
     * 
     * @param type table name without prefix, ex: abc_words > words
     * @param columns choose columns by numbers, each type has different columns
     * @returns selected columns 
     * @description example: 
     * 
     * - table words = select 'id, category, word' = 123; select 'id, word' = 13;
     * 
     * list of column:
     * - users - id | last_access | username | password | display_name | created_at | updated_at | deleted_at
     * - profiles - id | user_id (id, display_name) | description | photo | updated_at | deleted_at
     * - messages - 
     * - direct_chats - id | user_from | user_to | message_id (user_id, message, created_at, updated_at)
     * - group_chats - 
     * - group_chat_users - id, group_chat_id (name), user_id (display_name), role
     * - group_chat_messages - 
     */
    columnSelector(type: string, columns: number) {
        // to save selected column 
        const selectedColumns = []
        // for users table
        if(type === 'users') {
            const pickerList: string[] = ['id', 'last_access', 'username', 'password', 'display_name', 'created_at', 'updated_at', 'deleted_at']
            selectedColumns.push(columnPicker(pickerList))
        }
        // for profiles table
        else if(type === 'profiles') {
            const pickerList: string[] = ['id', 'user_id(id, display_name)', 'description', 'photo', 'updated_at', 'deleted_at']
            selectedColumns.push(columnPicker(pickerList))
        }
        // for messages table
        else if(type === 'messages') {
            // null
        }
        // for direct_chats table
        else if(type === 'direct_chats') {
            const pickerList: string[] = ['id', 'user_from', 'user_to', 'message_id(user_id, message, created_at, updated_at)']
            selectedColumns.push(columnPicker(pickerList))
        }
        // for group_chats table
        else if(type === 'group_chats') {
            // null
        }
        // for group_chat_users table
        else if(type === 'group_chat_users') {
            const pickerList: string[] = ['id', 'group_chat_id(name)', 'user_id(display_name)', 'role']
            selectedColumns.push(columnPicker(pickerList))
        }
        // for group_chat_messages table
        else if(type === 'group_chat_messages') {
            // null
        }
        // return selected columns
        return selectedColumns.join(', ')

        // looping columns
        function columnPicker(pickerList: string[]) {
            // temp col container
            const colsPicked = []
            // convert number to string for looping to work
            const cols = columns.toString()
            for(let col of cols) {
                // push selected column to container
                colsPicked.push(pickerList[+col - 1])
            }
            return colsPicked
        }
    }
}