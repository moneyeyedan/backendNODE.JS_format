/**
 * DatabaseController
 *
 * @description :: This api is for database functions with postgres and postgis!
 */

// const request = require('request');
 const pg = require('pg');
// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({
//     extended: false
// }));
// app.use(bodyParser.json());

const fetch = require("node-fetch");

const username = "root"; 
const password = "root"; 
const host = "localhost:5432";
const database = "myspatialdb"; // database name
const db_connection = "postgres://"+username+":"+password+"@"+host+"/"+database; 
    
const client = new pg.Client(db_connection);
client.connect(function (err) {
    if (!err) {
        console.log("Database is connected ...");
    } else {
        console.log("Error connecting database ...");
    }
});

module.exports = {

    default : function(req,res){
        res.send('This api is for database functions with postgres and postgis!');
        console.log('Api Called!');
    },

    getLandData : async(req,res) =>{
        //let name = req.body.name;
        
        let get_query = "SELECT jsonb_build_object('type','Feature','id',name,'geometry',ST_AsGeoJSON(perimeter)::jsonb,'properties', to_jsonb(row) - 'name' - 'perimeter') FROM (SELECT * FROM mapdata) row;";
        client.query(get_query,function(err,result){
            if (err) {
                console.log(err);
            } else {
                let resultant_array = [];
                for(let i = 0; i<result.rows.length;i++){
                    
                    for(let j=0; j<result.rows[i].jsonb_build_object.geometry.coordinates[0].length;j++){
                        [result.rows[i].jsonb_build_object.geometry.coordinates[0][j][0],result.rows[i].jsonb_build_object.geometry.coordinates[0][j][1]]=[result.rows[i].jsonb_build_object.geometry.coordinates[0][j][1],result.rows[i].jsonb_build_object.geometry.coordinates[0][j][0]];
                    }
                    let a = [result.rows[i].jsonb_build_object.id,result.rows[i].jsonb_build_object.geometry.coordinates[0]];
                    //console.log(a)
                    resultant_array.push(a)
                }
                res.send(resultant_array);
            }
        })
    },
    
    storeLandData : async(req,res) =>{
        
        let land_data = (req.body.land_data);
        let lat =land_data.features[0].geometry.coordinates[0][0][0];
        let lon =land_data.features[0].geometry.coordinates[0][0][1];
        
        
        var address = await fetch('https://maps.googleapis.com/maps/api/geocode/json?latlng='+lon+','+lat+'&key=AIzaSyCN9CfEFrF2Ke7P8ZyMoZewQFWx4PvVnOs');
        let result = await address.json();    
        
        let concat = "";
        land_data.features[0].geometry.coordinates.map(val1 => {
            
            val1.map(val2 => {
                val2.map((val3, index) => {
                    concat = (index == 0) ? concat + val3 + " " : concat + val3 + ",";
                })
            })
            //console.log(concat)
        })
        let query_string = "INSERT INTO mapdata (name, perimeter) VALUES ('"+result.plus_code.compound_code+"', ST_GeometryFromText('POLYGON(("+ concat.slice(0, -1) + "))'));"
        client.query(query_string,function(err,result){
            if (err) {
                console.log(err);
            } else {
                res.send('Land data has been stored!');
            }
        })
    }

};


