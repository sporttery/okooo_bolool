var mysql_pool = require('../src/mysql_pool');


async function getIdFromDb() {
    const conn = await mysql_pool.getConnection();
    const [rows, fields] = await conn.execute('SELECT max(id)+1 as id FROM `t_match`');
    conn.release();
    return rows[0].id;
}


process.on('exit', async (code) => {
    try {
        await mysql_pool.end()
    } catch (e) {}
})


const argv = process.argv.slice(2);


(async () => {
    let maxId = await getIdFromDb();
    console.log(maxId);
    process.exit();
})();