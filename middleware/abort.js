export default async function Abort(req,res,next) {
    res.status(401).json({ error : "Route not accessible!"})
}