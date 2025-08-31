// src/front/pages/TaskDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Spinner, Alert, Container, Row, Col, Card, Badge, Button, Tabs, Tab } from "react-bootstrap";
import SendOfferModal from "../components/SendOfferModal";
import ReviewTaskerModal from "../components/ReviewTaskerModal";
import TaskChat from "../components/TaskChat";
import { useStore } from "../hooks/useGlobalReducer";
import { TaskSessionProvider } from "../context/TaskSessionContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function TaskDetail() {
  const { store } = useStore();
  const currentUser = store?.user || null; // { id, role, ... } o null

  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // oferta del tasker actual (si existe)
  const [existingOffer, setExistingOffer] = useState(null);
  const [checkingOffer, setCheckingOffer] = useState(false);

  const [flash, setFlash] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const qsOpenReview = qs.get("openReview") === "1";
  const qsTaskerId = qs.get("taskerId");
  const qsDealId = qs.get("dealId");

  // 1) cargar task
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const base = (API_BASE || "").replace(/\/+$/, "");
        const url = `${base}/api/tasks/${taskId}`;
        const res = await fetch(url);
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();
        const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
        if (!res.ok) throw new Error(typeof data === "string" ? `HTTP ${res.status}: ${data.slice(0,120)}` : (data?.message || `HTTP ${res.status}`));
        setTask(data);
      } catch (e) {
        setError(e.message || "No se pudo cargar la tarea");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  // 2) si hay tasker logueado, buscar si ya ofertó para esta task
  useEffect(() => {
    const run = async () => {
      setExistingOffer(null);
      if (!currentUser?.id || currentUser?.role !== "tasker" || !taskId) return;
      setCheckingOffer(true);
      try {
        const base = (API_BASE || "").replace(/\/+$/, "");
        // ideal: endpoint filtrado por tasker_id
        // GET /api/tasks/:taskId/offers?tasker_id=:id
        const url = `${base}/api/tasks/${taskId}/offers?tasker_id=${currentUser.id}`;
        const res = await fetch(url);
        if (res.status === 404) { setExistingOffer(null); return; }
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();
        const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
        if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || `HTTP ${res.status}`));

        // soporta que la API devuelva {offer: {...}} o una lista
        const offer =
          (data && data.offer) ? data.offer :
          (Array.isArray(data) ? data.find(o => o?.tasker_id === currentUser.id) : null);

        setExistingOffer(offer || null);
      } catch (e) {
        // si no existe el endpoint, simplemente no bloqueamos el flujo
        setExistingOffer(null);
      } finally {
        setCheckingOffer(false);
      }
    };
    run();
  }, [currentUser?.id, currentUser?.role, taskId]);

  // abrir modal de review si ?openReview=1 (una sola vez)
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!loading && qsOpenReview && !autoOpenedRef.current) {
      setShowReviewModal(true);
      autoOpenedRef.current = true;
    }
  }, [loading, qsOpenReview]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;
  if (!task) return <Alert variant="warning">Tarea no encontrada</Alert>;

  // ====== permisos reales (sin demo) ======
  const isPublisher = !!currentUser && task?.publisher_id === currentUser?.id;

  const canSendOffer =
    !!currentUser &&
    currentUser.role === "tasker" &&
    !isPublisher &&
    task?.status === "open";

  const canChat =
    ["assigned", "in_progress", "completed"].includes(task?.status) &&
    !!currentUser &&
    (task?.publisher_id === currentUser.id || task?.assigned_tasker_id === currentUser.id);

  const canReviewTasker =
    task?.status === "completed" &&
    currentUser?.role === "client" &&
    isPublisher &&
    !!task?.assigned_tasker_id;

  const handleOfferSaved = (saved) => {
    setFlash(existingOffer ? "¡Oferta actualizada!" : "¡Oferta enviada!");
    setExistingOffer(saved); // refleja el último estado
  };
  const handleReviewCreated = () => setFlash("¡Calificación enviada con éxito!");

  return (
    <TaskSessionProvider task={task} currentUser={currentUser}>
      <Container className="py-4">
        {flash && (
          <Alert variant="success" onClose={() => setFlash("")} dismissible className="mb-3">
            {flash}
          </Alert>
        )}

        <Row className="mb-3">
          <Col>
            <h1 className="mb-1">{task.title}</h1>
            {task.status && <Badge bg="info">{task.status}</Badge>}
          </Col>
        </Row>

        <Row>
          {/* Izquierda: Tabs */}
          <Col md={8}>
            <Tabs defaultActiveKey="detalle" className="mb-3" fill>
              <Tab eventKey="detalle" title="Detalle">
                <Card className="mb-3">
                  <Card.Header>Descripción</Card.Header>
                  <Card.Body>
                    <p>{task.description || "Sin descripción"}</p>
                  </Card.Body>
                </Card>
              </Tab>

              {canChat && (
                <Tab eventKey="chat" title="Chat">
                  <Card className="mb-3">
                    <Card.Header>Mensajes de la tarea</Card.Header>
                    <Card.Body>
                      <TaskChat taskId={task.id} user={currentUser} demo={false} />
                    </Card.Body>
                  </Card>
                </Tab>
              )}
            </Tabs>
          </Col>

          {/* Derecha: Detalles + botones */}
          <Col md={4}>
            <Card className="mb-3">
              <Card.Header>Detalles</Card.Header>
              <Card.Body>
                {task.price != null && <p><strong>Precio:</strong> ${Number(task.price).toLocaleString()}</p>}
                {task.location && <p><strong>Ubicación:</strong> {task.location}</p>}
                <p><strong>Publicado por:</strong> {task.publisher_id}</p>
                <Link to={`/u/${task.publisher_id}`}>Ver perfil</Link>
                {task.assigned_tasker_id && (
                  <p className="mt-2"><strong>Tasker asignado:</strong> {task.assigned_tasker_id}</p>
                )}
              </Card.Body>
            </Card>

            {/* Oferta */}
            {canSendOffer && (
              <>
                {checkingOffer ? (
                  <Alert variant="secondary">Verificando tu oferta previa…</Alert>
                ) : existingOffer ? (
                  <Alert variant="info" className="mb-2">
                    Ya ofertaste: <strong>${Number(existingOffer.amount).toLocaleString()}</strong>.
                    Puedes <u>actualizar</u> tu oferta (monto o mensaje).
                  </Alert>
                ) : null}

                <Button
                  variant="primary"
                  className="me-2 mb-2"
                  onClick={() => setShowOfferModal(true)}
                >
                  {existingOffer ? "Actualizar oferta" : "Enviar oferta"}
                </Button>
              </>
            )}

            {/* Calificar */}
            {canReviewTasker && (
              <Button variant="success" className="mb-2" onClick={() => setShowReviewModal(true)}>
                Calificar tasker
              </Button>
            )}
          </Col>
        </Row>

        {/* Modales */}
        <SendOfferModal
          show={showOfferModal}
          onHide={() => setShowOfferModal(false)}
          taskId={task.id}
          onCreated={handleOfferSaved}
          existingOffer={existingOffer}    // <<— clave
        />

        <ReviewTaskerModal
          show={showReviewModal}
          onHide={() => setShowReviewModal(false)}
          taskId={task.id}
          taskerId={Number(qsTaskerId) || task.assigned_tasker_id}
          dealId={qsDealId ? Number(qsDealId) : undefined}
          onCreated={handleReviewCreated}
          demo={false}
        />
      </Container>
    </TaskSessionProvider>
  );
}
