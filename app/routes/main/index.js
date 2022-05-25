const fetch = require('node-fetch')
const fs = require('fs')

const fetchTokens = async (id) => {
  const body = `query OriginalTokens {
    generativeToken(id: ${id}) {
      id
      name
      entireCollection {
        id
        iteration
        owner {
          id
          name
        }
      }
    }
  }`

  const response = await fetch('https://api.fxhash.xyz/graphql', {
    method: 'post',
    body: JSON.stringify({
      query: body
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  const data = await response.json()
  return data
}
exports.index = async (req, res) => {
  const startTime = new Date().getTime()

  //  If we have been passed to from and to, then we need to go grab the data
  if (req.query && req.query.from && req.query.to) {
    const from = parseInt(req.query.from)
    const to = parseInt(req.query.to)
    const transferMap = {}

    req.templateValues.from = {
      id: from
    }
    const fromData = await fetchTokens(from)
    //  Go grab the name
    if (fromData.data && fromData.data.generativeToken && fromData.data.generativeToken.name) {
      req.templateValues.from.name = fromData.data.generativeToken.name
    }
    //  We want to get the token IDs from the things we are going *from*
    if (fromData.data && fromData.data.generativeToken && fromData.data.generativeToken.entireCollection) {
      fromData.data.generativeToken.entireCollection.forEach((row) => {
        transferMap[row.iteration] = {
          gentk: row.id
        }
      })
    }

    //  Now do the to stuff
    req.templateValues.to = {
      id: to
    }
    const toData = await fetchTokens(to)
    if (toData.data && toData.data.generativeToken && toData.data.generativeToken.name) {
      req.templateValues.to.name = toData.data.generativeToken.name
    }
    //  We want to get the token IDs from the things we are going *from*
    if (toData.data && toData.data.generativeToken && toData.data.generativeToken.entireCollection) {
      toData.data.generativeToken.entireCollection.forEach((row) => {
        if (row.owner) {
          transferMap[row.iteration].owner = row.owner.id
          transferMap[row.iteration].name = row.owner.name
        }
      })
    }
    req.templateValues.transferMap = transferMap
    req.templateValues.rows = Object.entries(transferMap).length
    console.log(req.templateValues)
  }

  req.templateValues.elapsed = new Date().getTime() - startTime
  return res.render('main/index', req.templateValues)
}