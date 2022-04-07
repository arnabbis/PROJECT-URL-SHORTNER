const userModel = require("../Model/userModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    17204,
    "redis-17204.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("X9922SsL9C3K2ScYfEA69zOatApQrHkw", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});


//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


// ### POST /url/shorten:

const createUrl = async function (req, res) {
    try {
        const baseUrl = "http://localhost:3000/"
        const data = req.body
        const { longUrl } = data
        let keys = Object.keys(data)
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "please put some data in the body" })
        }
        if (keys.length > 0) {
            if (!(keys.length == 1 && keys == 'longUrl')) {
                return res.status(400).send({ status: false, message: "only longUrlfield is allowed" })
        }
        if (!/^https?:\/\/\w/.test(baseUrl.trim())) { 
            return res.status(400).send({ status: false, msg: "baserUrl is not valid" }) 
        }
        // VALIDATING LONG-URL:
        if (!data.longUrl) {
            return res.status(400).send({ status: false, msg: "longUrl is not present" })
        }
        if (data.longUrl.trim().length == 0){
            return res.status(400).send({ status: false, msg: "enter the longUrl in proper format" })
        }
        if (!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-])?\??(?:[\-\+=&;%@\.\w])#?(?:[\.\!\/\\\w]*))?)/).test(longUrl.trim())) 
        {
            return res.status(400).send({ status: false, msg: "longUrl is invalid" })
        }
        let duplicateUrl = await userModel.findOne({ longUrl: longUrl })
        if (duplicateUrl) {
            return res.status(200).send({ status: true,msg: "shortUrl is already present for this longUrl", data: { "longUrl": duplicateUrl.longUrl, "shortUrl": duplicateUrl.shortUrl, "urlCode": duplicateUrl.urlCode } })
        }
        // VALIDATING URL-CODE:
        data.urlCode = shortId.generate().toLowerCase()
        // VALIDATING SHORT-URL:
        data.shortUrl = baseUrl + `${data.urlCode}`
        console.log(data.shortUrl)
        // CACHEING OF THE TOTAL DATA:
        let cahcedLongUrlData = await GET_ASYNC(`${duplicateUrl}`)
        if (cahcedLongUrlData) {
            return res.status(400).send({ status: false, message: "data is present in the catche" })
        }
        else {
            await SET_ASYNC(`${longUrl}`, (JSON.stringify(duplicateUrl)))
        const SavedUrl = await userModel.create(data)
        return res.status(201).send({ status: true, msg: "url-shortend", data: { "longUrl": SavedUrl.longUrl, "shortUrl": SavedUrl.shortUrl, "urlCode": SavedUrl.urlCode } })
    }}
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

// ### GET /:urlCode:

const getUrlcode = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        if (urlCode.trim().length == 0) {
            return res.status(400).send({ status: false, msg: "params value is not present" })
        }
        if (urlCode.length != 9) {
            return res.status(400).send({ status: false, msg: "not a valid urlCode" })
        }
        const url = await userModel.findOne({ urlCode })
        if (!url) { 
            return res.status(404).send({ status: false, msg: "urlCode is not present" })
         }
        let cahcedLongUrlData = await GET_ASYNC(`${urlCode}`)
        if (cahcedLongUrlData) {
            res.redirect(JSON.parse(cahcedLongUrlData).longUrl)
        } else {
            let cache = await userModel.findOne({ urlCode });
            await SET_ASYNC(`${urlCode}`, (JSON.stringify(cache)))
            return res.status(302).redirect(url.longUrl)
        }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}






module.exports.createUrl = createUrl
module.exports.getUrlcode = getUrlcode

