import { useEffect, useState } from "react";

export const AdminCard = ({user_id}) =>{
    const [user, setUser] = useState("")
    const [admUser, setAdmUser]= useState("")
    const [date, setDate]= useState("")

    const getAdminProfile = async (user_id) => {
        try {
            const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
            const r = await fetch(`${BASE}/api/users/${user_id}/profile`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            const data = await r.json()
            setUser(data)
            setDate(data["created_at"].substring(8, 16))

        } catch (err) {
            console.error(err);
            // TODO: mostrar error en UI
        }
    };

    const getAdminUser = async (user_id) => {
        try {
            const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
            const r = await fetch(`${BASE}/api/users/${user_id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })
            const data = await r.json()
            setAdmUser(data)
        } catch (err) {
            console.error(err);
            // TODO: mostrar error en UI
        }
    };
    
    const full_name = user["name"] + " " + user["last_name"]
    const created = "Miembro desde " + date
    console.log(user)
    console.log(admUser)

   useEffect(() => {
        getAdminProfile(user_id)
        getAdminUser(user_id)
    }, [])
    
    return (
    <div className="card mb-3 text-white">
        <div className="row g-0">
            <div className="col-3">
                <img src={user.avatar? user.avatar:"https://i.pinimg.com/564x/40/c5/3f/40c53ff5a0da610aa4daff660c962961.jpg"} className="img-fluid rounded-circle my-2" alt="..." />
            </div>
            <div className="col-9 d-flex">
                <div className="card-body">
                    <h5 className="card-title fs-4">{full_name}</h5>
                    <p className="card-text fs-5">Administrador principal</p>
                    <p className="card-text">{admUser.email}</p>
                    <p className="card-text"><small className="">{created}</small></p>
                </div>
            </div>
        </div>
    </div>
);}