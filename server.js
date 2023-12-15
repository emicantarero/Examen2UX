//Librerias

//Express
const express = require('express');
const servidor = express();
let port = 3001;
servidor.listen(port, ()=>{
    console.log('Servidor ejecutandose correctamente en el puerto: ', port);
});
//Mongo
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://emicantarero:Hernandez09@examenux.aotz8sy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
}
run().catch(console.dir);

//Firebase
const {initializeApp} = require("firebase/app");
const {getAnalytics} = require("firebase/analytics");
const {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification} = require("firebase/auth");
const firebaseConfig = {
    apiKey: "AIzaSyAn6XyIqfyz5pRYIP_OCkvkIfNOfCjjz4M",
    authDomain: "examen2ux-500d3.app.com",
    projectId: "examen2ux-500d3",
    storageBucket: "examen2ux-500d3.appspot.com",
    messagingSenderId: "358067411942",
    appId: "1:358067411942:web:6ac15ce14cb8d73b7a5427",
    measurementId: "G-PN2YNLMXSB"
};
const app = initializeApp(firebaseConfig);
//body-parser
const bodyParser = require('body-parser');
var urlEncodeParser = bodyParser.urlencoded({extended:true});
servidor.use(urlEncodeParser);
//Cors
const path = require('path');
//Path 
const cors = require('cors');
servidor.use(cors());

//EndPoints solicitados
servidor.post("/createUser",  (req, res) => {
    const auth = getAuth(app);
    const email = req.body.email;
    const password = req.body.password;
    createUserWithEmailAndPassword(auth, email, password)
      .then((resp) => {
          res.status(200).send({
          msg: "Usuario creado exitosamente",
          data: resp,
        });
        sendEmailVerification(auth.currentUser).then(()=>{
          console.log('Se envio el correo de verificacion');
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).send({
          msg: "Error al crear el usuario",
          errorCode: errorCode,
          errorMsg: errorMessage,
        }); 
    });
  })

servidor.post("/logIn",  (req, res) => {
    try {
      const auth = getAuth(app);
      const email = req.body.email;
      const password = req.body.password;
      signInWithEmailAndPassword(auth, email, password)
        .then((resp) => {
            res.status(200).send({
            msg: "Sesion iniciada",
            data: resp,
          })
      })
      .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          res.status(500).send({
            msg: "Error al iniciar sesion, credenciales incorrectas", 
            errorCode: errorCode,
            errorMsg: errorMessage,
          });
    });
    } catch (error) {
      const errorCode = error.code;
        const errorMessage = error.message;
        res.status(500).send({
          msg: "Error al iniciar sesion, credenciales incorrectas", 
          errorCode: errorCode,
          errorMsg: errorMessage,
        });
    }
});

servidor.post("/logOut",  (res) => {
    const auth = getAuth(app);
    signOut(auth).then(() => {
      console.log('Se cerro bien la sesion');
    }).catch((error) => {
      console.log('Hubo un error');
    });
});

servidor.post('/createPost', async (req, res)=>{
    try {
        const client = new MongoClient(uri);
        const mainDB = client.db("mainDB");
        const Post = mainDB.collection("Post");
        const doc = req.body;
        const result = await Post.insertOne(doc);
        console.log(
            `Se inserto un documento con el _id: ${result.insertedId}`,
        );
        res.status(200).send("El Post se creo exitosamente")
    } catch(error){
        res.status(500).send("No se creo el Post, algo salio mal")
    }finally {
        await client.close();
    }
    
})

servidor.get('/listPost', async (req, res)=>{
    try {
        const client = new MongoClient(uri);
        const mainDB = client.db("mainDB");
        const Post = mainDB.collection("Post");
        const query = {};
        const options = {
            sort: { Titulo: 1 },
        };
        const cursor = Post.find(query, options);
        if ((await Post.countDocuments(query)) === 0) {
            res.status(500).send("No se encontraron Posts")
        }else{
            let arr = []
            for await (const doc of cursor) {
                console.dir(doc);
                arr.push(doc)
            }
            res.status(200).send({
                documentos: arr,
            });
        }
        
    } catch(error){
        res.status(500).send("Algo salio mal")
        console.log(error);
    }finally {
        await client.close();
    } 
    run().catch(console.dir);
})

servidor.put('/editPost', async (req, res)=>{
    try {
        const client = new MongoClient(uri);
        const mainDB = client.db("mainDB");
        const Post = mainDB.collection("Post");
        const filter = {Titulo:req.body.Titulo};
        const options = { upsert: true };
        const updateDoc = {
            $set: {
            ...req.body,
          },
        };
        const result = await Post.updateOne(filter, updateDoc, options);
        console.log(
            `${result.matchedCount} documento cumplio con las caracteristicas establecidas, se actualizaron ${result.modifiedCount} documento(s)`,
         );
        res.status(200).send("El post se actualizo correctamente")
        //res.status(200).send(`${result.matchedCount} documento cumplio con las caracteristicas establecidas, se actualizaron ${result.modifiedCount} documento(s)`)
    } catch(error){
        res.status(500).send("Algo salio mal, no se pudo actualizar el post")
        console.log(error);
    }finally {
        await client.close();
    } 
    run().catch(console.dir);
})

servidor.delete('/deletePost', async (req, res)=>{
    try {
        const client = new MongoClient(uri);
        const mainDB = client.db("mainDB");
        const Post = mainDB.collection("Post");
        const query = {Titulo:req.body.Titulo};
        const result = await Post.deleteOne(query);
        if (result.deletedCount === 1) {
            console.log("Se borro el Post correctamente");
            res.status(200).send("Se borro el Post correctamente")
        } else {
            console.log("Ningun Post concuerda con la informacion brindada, no se borro ninguno");
        }
    } catch(error){
        res.status(500).send("Algo salio mal, no se pudo borrar el post")
        console.log(error);
    }finally {
        await client.close();
    } 
    run().catch(console.dir);
})


