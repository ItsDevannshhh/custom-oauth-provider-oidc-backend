import connectDB from "./common/db/db.connect.js";
import http from "http";
import app from "./src/app.js";


const PORT = process.env.PORT || 8080;

async function main(){
    try{
        await connectDB();

        const server = http.createServer(app);

        server.listen(PORT, () => {
            console.log(`server is listening on PORT : ${PORT}`);
        })
    } catch(err){
        console.log("error starting the server", err);
    }
}

main();