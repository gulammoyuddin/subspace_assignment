const express = require('express')
const ld=require('lodash')
var analyse=ld.memoize(function(blogs){
    return {
        'Total number of blogs.':ld.size(blogs),
        'The title of the longest blog.':ld.sortBy(blogs,function(o){
            return o.title.length
          })[ld.size(blogs)-1].title,
        'Number of blogs with "privacy" in the title.':ld.size(ld.filter(blogs,function(o){
            return o.title.toLowerCase().includes("privacy")
          })),
        'An array of unique blog titles.':ld.uniqBy(blogs,'title')
    }
})
var search=ld.memoize(function(blogs,key){
    return ld.filter(blogs,function(o){return o.title.toLowerCase().includes(key)})
})
var fetched=ld.memoize(async function(){
    const options = {
        method: 'GET',
        headers: {
          'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
        }
      };
      const fet=await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', options)
      return await fet.json()
})
const gotcha=async (request,response,next)=>{
    try{      
        request.body=await fetched()
    }catch(exception){
        console.log(exception)
        response.status(500).send({error:'Internal Server Error'})
    }
        next()
}

app=express()

app.get('/api/blog-stats',gotcha,(req,res)=>{
    //console.log(req.body)
    if(req.body.blogs){
    res.json(analyse(req.body.blogs))
    }else{
        res.status(500).send({error:"Internal Server Error"})
    }
})

app.get('/api/blog-search:query?',gotcha,(req,res)=>{

    const fil=req.param('query')
    if(req.body.blogs){
        res.json(search(req.body.blogs,fil))
    }else{
        res.status(500).send({error:"Internal Server Error"})
    }
})
const unknownEndpoint=(request,response)=>{
    response.status(404).send({error:'Unknown Endpoint'})
}
app.use(unknownEndpoint)
const PORT=3001
app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})