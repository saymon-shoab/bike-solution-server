const express = require('express');
const cors = require('cors')
const fs = require('fs-extra');
const ObjectID = require('mongodb').ObjectID
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5h4lz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app =express()

app.use(express.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req,res)=>{
    res.send('hello from db')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const adminCollection = client.db("bikeSolution").collection("admin");
  const bookingsCollection = client.db("bikeSolution").collection("bookings");
  const reviewCollection = client.db("bikeSolution").collection("review");
  const servicesCollection = client.db("bikeSolution").collection("services");
   
  app.post('/addBooking', (req, res)=>{
    const newBooking = req.body;
    bookingsCollection.insertOne(newBooking)
    .then(result=>{
        res.send(result.insertedCount > 0)
    })
    console.log(newBooking);
      
  })

  app.get('/bookings', (req, res)=>{    
    bookingsCollection.find({email: req.query.email})
    .toArray((err, documents)=>{
        res.send(documents)
    })
  })
  app.get('/allBookings', (req, res)=>{    
    bookingsCollection.find({})
    .toArray((err, documents)=>{
        res.send(documents)
    })
  })

  app.post('/addService', (req, res)=>{
      const file = req.files.file;
      const name = req.body.name;
      const description = req.body.description;
      const price = req.body.price;
      const filePath = `${__dirname}/services/${file.name}`;
      console.log(file,name,description,price);
      file.mv(filePath, err =>{
          if(err){
              console.log(err);
              return res.status(500).send({msg : 'fail to upload image'})
          }
          const newImg = fs.readFileSync(filePath)
          const encImg = newImg.toString('base64');
          
          var image = {
            contentType: req.files.file.mimetype,
            size: req.files.file.size,
            img: Buffer.from(encImg, 'base64')
        };
        servicesCollection.insertOne({name ,  description , price , image})
        .then(result => {
            fs.remove(filePath, error =>{
                if(error){console.log(error)}
                res.send(result.insertedCount > 0);
            }) 
      })
    })
})
         app.get('/services', (req, res)=>{
            servicesCollection.find({})
            .toArray((err, documents)=>{
                res.send(documents);
            })
         })
         app.get('/service/:id', (req, res)=>{
            servicesCollection.find({_id : ObjectID(req.params.id)})
            .toArray((err,documents)=>{
                console.log(err)
                res.send(documents[0])
            })
         })
        
         app.post('/addAdmin', (req, res)=>{
             const email =req.body.email;
             console.log(email      )
             adminCollection.insertOne({ email })
             .then(result => {
               res.send(result.insertedCount > 0);
           })

         })
      app.post('/addReview', (req, res)=>{
          const name = req.body.name;
          const service = req.body.service;
          const description = req.body.description;
          console.log(name, service, description)
    
      reviewCollection.insertOne({  name,  service , description })
      .then(result => {
        res.send(result.insertedCount > 0);
    })
  
})
    
    app.get('/reviews', (req, res)=>{
        reviewCollection.find({})
        .toArray((err, documents)=>{
            res.send(documents);
        })
    })

    app.delete('/delete/:id', (req, res)=>{
        console.log(req.params.id)
        const id = ObjectID(req.params.id);
        servicesCollection.deleteOne({_id: id})
        .then(result=>{
            console.log(result)
        })
    })
    app.post('/isAdmin', (req, res)=>{
        const email = req.body.email;
        adminCollection.find({ email: email})
        .toArray((err, admin)=>{
            res.send(admin.length> 0);
        })
    })

});


app.listen(process.env.PORT || port)