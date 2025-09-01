// src/front/pages/Admin.jsx
import { Link } from "react-router-dom";
import { useStore } from "../hooks/useGlobalReducer";
import { AdminCard } from "../components/AdminCard";
import { useState } from "react";

export const Admin = () => {
    const { store /*, actions*/ } = useStore();

    const filterList = ["todo", "pendiente", "abierta", "cerrada"];
    const taskList = [
        {
            "id": 1,
            "title": "tasker didn't come",
            "user": 4,
            "status": "abierta",
            "priority": "alta",
            "category": "mascotas",
            "created_at": "2025-08-29"
        },
        {
            "id": 3,
            "title": "tasker made a bad job",
            "user": 20,
            "status": "pendiente",
            "priority": "baja",
            "category": "jardín",
            "created_at": "2025-08-25"
        },
        {
            "id": 5,
            "title": "My bed fell apart",
            "user": 12,
            "status": "cerrada",
            "priority": "baja",
            "category": "muebles",
            "created_at": "2025-08-27"
        },
        {
            "id": 7,
            "title": "Tasker asked for more money in person",
            "user": 1,
            "status": "abierta",
            "priority": "media",
            "category": "jardín",
            "created_at": "2025-08-27"
        },
    ]
    const [list, setList] = useState(taskList)
    const filterTasks = (filtr) => {
        const filtro = filtr.filtro
        if (filtro == "todo") {
            return setList(taskList)
        }
        const newTasks = taskList.filter((task) => task.status == filtro)
        console.log(newTasks)
        return setList(newTasks)
    }
    const tableHeader = [
        "ID",
        "Título",
        "Usuario",
        "Estado",
        "Prioridad",
        "Categoría",
        "Fecha creación",
        "Acciones",
    ];
    const apiVars = ["id", "title", "user", "status", "priority", "category", "created_at"];

    return (
        <div className="container">
            <h2>Panel de Administrador</h2>

            <AdminCard user_id="1" />

            <div className="border-top">
                <div className="fs-4">Gestión de disputas</div>
                <p>Administra y resuelve las disputas de los usuarios</p>

                <div className="btn-group" role="group" aria-label="filtros">
                    {filterList.map((filtro, i) => (
                        <button key={i} type="button" className="btn btn-outline-secondary rounded-pill mx-1"
                            onClick={() => filterTasks({ filtro })}>
                            {filtro}
                        </button>
                    ))}
                </div>

                <table className="table">
                    <thead>
                        <tr>
                            {tableHeader.map((h, i) => (
                                <th key={i} scope="col">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {/* Fila de ejemplo: reemplazar por data real cuando conectes la API */}
                        {list.map((item) => (<tr>
                            <td>{item.id}</td>
                            <td>{item.title}</td>
                            <td>{item.user}</td>
                            <td>{item.status}</td>
                            <td>{item.priority}</td>
                            <td>{item.category}</td>
                            <td>{item.created_at}</td>
                            <td>
                                <div
                                    className="btn-group rounded-pill bg-secondary p-1"
                                    role="group"
                                    aria-label="acciones-disputa"
                                >
                                    <button type="button" className="btn text-white rounded-pill">
                                        <small>Enviar caso</small>
                                    </button>
                                    <button type="button" className="btn text-white rounded-pill bg-dark">
                                        <small>Cerrar caso</small>
                                    </button>
                                </div>
                            </td>
                        </tr>))}
                    </tbody>
                </table>
            </div>

            <br />
            <Link to="/">
                <button className="btn btn-primary">Back home</button>
            </Link>
        </div>
    );
};

export default Admin;