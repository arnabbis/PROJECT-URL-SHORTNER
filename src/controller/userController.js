const userModel = require("../Model/userModel")
const shortId = require("shortid")
const validUrl = require("valid-url")
const baseUrl = "http://localhost:3000/"

// ### POST /url/shorten:

const urlMake = async function(req,res){
try{
    const data = req.body
    const {longUrl,shortUrl,urlCode} = data
    if(Object.keys(data)==0)return res.status(400).send({status:false,msg:"please put details in the body"})
    // VALIDATING BASE URL:
    if (!validUrl.isUri(baseUrl.trim())){return res.status(400).send({status:false,msg:"baserUrl is not valid"})}
    // VALIDATING LONG-URL:
    if(!data.longUrl) return res.status(400).send({status:false,msg:"longUrl is not present"})
    if(data.longUrl.trim().length == 0) return res.status(400).send({status:false,msg:"enter the longUrl in proper format"})
    if (!validUrl.isUri(longUrl.trim())){return res.status(400).send({status:false,msg:"longUrl is not valid"})}
    // VALIDATING URL-CODE:
    if(!data.urlCode) return res.status(400).send({status:false,msg:"UrlCode is not present"})
    if(data.urlCode.trim().length == 0) return res.status(400).send({status:false,msg:"enter the urlcode in proper format"})
    let dupurlCode = await userModel.findOne({urlCode:urlCode.trim()})
    if(dupurlCode) return res.status(400).send({status: false, msg: `${data.urlCode} is already registered`})
    // VALIDATING SHORT-URL:
    if(!data.shortUrl) return res.status(400).send({status:false,msg:"shortUrl is not present"})
    if(data.shortUrl.trim().length == 0) return res.status(400).send({status:false,msg:"enter the shortUrl in proper format"})
    data.shortUrl = baseUrl + `${data.urlCode}`.toLowerCase()
    console.log(data.shortUrl)
    const SavedUrl = await userModel.create(data)
    return res.status(201).send({status: true,msg:"url-shortend", data: {"longUrl": SavedUrl.longUrl,"shortUrl": SavedUrl.shortUrl,"urlCode": SavedUrl.urlCode}})
}catch(error) {
    return res.status(500).send({status:false, msg: error.message})
}}

// ### GET /:urlCode:

const getUrlcode = async function(req,res){
    try{
       const urlCode = req.params.urlCode
       if(!urlCode)return res.status(400).send({status:false,msg:"params value is not present"})
       const url = await userModel.findOne({urlCode})
       if(!url){return res.status(400).send({status:false,msg:"urlCode is not present"})}
       res.status(200).send({status:true,msg:"longUrl",data:url.longUrl})
    }catch(error) {
    return res.status(500).send({status:false, msg: error.message})
    }
}





module.exports.urlMake = urlMake
module.exports.getUrlcode = getUrlcode

