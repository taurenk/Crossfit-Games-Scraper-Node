
let request = require('request-promise');
let async = require('async');

const config = require('./config/config.dev.json');
var pg = require('knex')(config.database);


const mensDivision = 1;
const womansDivision = 2;
const rxDivision = 0;
const scaledDivision = 1;

const baseApiURL = 'https://games.crossfit.com/competitions/api/v1/competitions/open/2017/leaderboards';


scrapeLeaderBoard(mensDivision, rxDivision, 1, 2);
//scrapeLeaderBoard(womansDivision, 1, 2);


function scrapeLeaderBoard(divisionId, divisionType, currentPageNumber, maxPageNumber) {

    if (currentPageNumber > maxPageNumber) {
        return;
    } else {

        let options = {
            uri: baseApiURL,
            qs: {
                page: currentPageNumber,
                competition: 1,
                year: 2017,
                division: divisionId,
                scaled: divisionType,
                sort: 0,
                fittest: 1,
                fittest1: 0,
                occupation: 0
            },
            json: true
        };
        
        request.get(options)
            .then((results)=>{
                
                maxPageNumber = results.totalpages;

                let rows = results.athletes.map((athlete) => {

                    // TODO; Standardize height/weight
                    return {
                        userid: athlete.userid,
                        name: athlete.name,
                        region_id: athlete.regionid,
                        region_name: athlete.region,
                        affiliate_id: athlete.affiliateid,
                        affiliate_name: athlete.affiliate,
                        age: athlete.age,
                        height: athlete.height,
                        weight: athlete.weight,
                        division_id: athlete.division,
                        profilepic_url: athlete.profilepic
                    }
                });
              
                return pg('athletes_staging').insert(rows);
                
            })
            .then((results) => {
                console.log(`\trec call; ${currentPageNumber+1} / ${maxPageNumber}`);
                scrapeLeaderBoard(divisionId, divisionType, currentPageNumber+1, maxPageNumber);
            })
            .catch((error)=>{
                console.log(`Error Scraping Page ${currentPageNumber};` + error);
            });
    }
}




function getAthleteData(athletesArray) {
   
    return new Promise((resolve, reject) => {

         async.map(athletesArray, (athlete, callback) => {
            let athlete_options = {
                uri: 'https://games.crossfit.com/athlete/201305'
            };
            
            request.get(athlete_options)
                .then((data)=> {
                    callback(null, athlete.userid);
                })
                .catch((err)=>{
                    callback(err, null);
                });

        }, (err, result)=> {
            if (err) {
                reject(err);
            } 
            resolve(result);
        });
        
    });
}


