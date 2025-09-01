// src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate, useLocation, useMatch } from "react-router-dom";
import { useStore } from "../hooks/useGlobalReducer";

export function Navbar() {
	const { store, actions } = useStore();
	const user = store.user;
	const nav = useNavigate();

	const [open, setOpen] = useState(false);
	const ref = useRef(null);

	useEffect(() => {
		const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	// destino de My tasks
	const myHref = user ? (user.role === "tasker" ? "/tasker" : "/client") : "/login";

	// activo si estás en /client/* o /tasker/*
	const matchClient = useMatch("/client/*");
	const matchTasker = useMatch("/tasker/*");
	const myActive = Boolean(matchClient || matchTasker);

	function onLogout() {
		actions.logout?.();
		setOpen(false);
		nav("/", { replace: true });
	}

	return (
		<nav className="nav">
			<div className="nav__inner">
				<Link to="/" className="brand brand--glow brand--button" aria-label="Tasky home">
					<span className="brand__mark" aria-hidden="true"></span>
					<span className="brand__word">Tas</span>
					<span className="brand__accent">ky</span>
				</Link>

				<div className="nav__links">
					<NavLink
						to="/post"
						end
						className={({ isActive }) => (isActive ? "btn btn-primary" : "link")}
					>
						Post a task
					</NavLink>

					<NavLink
						to="/browse"
						className={({ isActive }) => (isActive ? "btn btn-primary" : "link")}
					>
						Browse tasks
					</NavLink>

					<NavLink
						to={myHref}
						className={() => (myActive ? "btn btn-primary" : "link")}
					>
						My tasks
					</NavLink>
				</div>

				<div className="nav__right">
					<NavLink
						to="/help"
						className={({ isActive }) => (isActive ? "btn btn-primary" : "link")}
					>
						Help
					</NavLink>

					{!user ? (
						<>
							<NavLink
								to="/login"
								className={({ isActive }) => (isActive ? "btn btn-primary" : "link")}
							>
								Log in
							</NavLink>

							{/* SIEMPRE verde */}
							<Link to="/register" className="btn btn-signup">Sign up</Link>
						</>
					) : (
						<div ref={ref} style={{ position: "relative" }}>
							{/* ...tu menú de usuario... */}
							<button onClick={onLogout} className="link">Logout</button>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
}