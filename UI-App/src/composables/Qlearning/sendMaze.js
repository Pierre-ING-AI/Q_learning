import axios from "axios";

const sendMaze = async(maze)=>{
    try{
        const endpoint = 'http://localhost:3005/learning';
        const response = await axios.post(endpoint,{"maze":JSON.parse(JSON.stringify(maze))});
        return response;
;    }catch{
        console.error('error sending email:',error);
        throw error;
    }
}
export default sendMaze;