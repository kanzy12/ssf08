//load node modules
const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
const bodyParser = require('body-parser');

//set tunables
const PORT = parseInt(process.argv[2] || 3000);

//initialise data
const teamsData = {};

const config = require('./config.json');
console.log(config['test']);

//create mysql connection pool
const pool = mysql.createPool(
    require('./config.json')
);

//initialise sql stuff
const sqlSelectEmployeesByName = 'select * from employees where first_name like ? or last_name like ?';
const makeQuery = (sqlQuery, pool) => {
    return (params) => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) {
                    console.log('Cannot connect to database: ', err);
                    reject(err);
                }
                else {
                    conn.query(sqlQuery, params, (err, results) => {
                        conn.release();
                        if (err) {
                            console.log('Cannot query database', err);
                            reject(err);
                        }
                        else {
                            resolve(results);
                        }
                    })
                }
            })
        })
    }
}

const getEmployeesByFirstLastName = makeQuery(sqlSelectEmployeesByName, pool);

pool.getConnection((err, conn) => {
    if (err) {
        console.log('Cannot connect to database: ', err);
        process.exit(-1);
    }
    else {
        conn.ping(err => {
            conn.release();
            if (err) {
                console.log('Cannot ping database: ', err);
                process.exit(-1);
            }
            else {
                console.log('Successfully pinged database');
            }
        });
    }
});

app = express();

//initialise handlebars stuff
const hbs = exphbs.create(
    {
        defaultLayout: 'main.hbs',
        extname: '.hbs',
        partialsDir: __dirname + '/views/partials'
    }
);
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
// app.set('views', __dirname + '/views');

//initialise express stuff
app.use(bodyParser.urlencoded({extended: true}));

app.get('/team', (req, res) => {
    let name = req.query['name'];

    getEmployeesByFirstLastName([`%${name}%`, `%${name}%`])
    .then (results => {
        res.status(200);
        res.type('text/html');
        res.render('createTeam', 
        {
            search: false,
            resultsContext: {employees: results}
        });
    })
    .catch (err => {

    });
});

app.post('/team', (req, res) => {
    let name = req.body['name'];
    if (!(name in teamsData)){
        teamsData[name] = [];
    }

    res.status(200);
    res.type('text/html');
    res.render('createTeam',
    {
        name: name,
        search: true,
        test: 'TESTPROP',
        searchContext:
        {
            name: 'Search Name'
        },
        resultsContext: {
            name: 'ResultsName'
        }
    });
});

//serve index
app.get(['/', '/index.html'], (req, res) => {
    res.status(200);
    res.type('text/html');
    res.render('welcome');
});

//serve public files
app.get(/.*/, express.static(__dirname + '/public'));

//start the server
app.listen(PORT, () => {
    console.info(`App started on port ${PORT} at ${new Date()}`);
});