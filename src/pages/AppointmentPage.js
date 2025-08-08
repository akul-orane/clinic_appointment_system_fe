import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 18;
const HEADER_H = 52;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function snapTo(mins, step = SLOT_MINUTES) {
  return Math.round(mins / step) * step;
}
function floorSnapTo(mins, step = SLOT_MINUTES) {
  return Math.floor(mins / step) * step;
}
function minutesSinceStart(d) {
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}
function timeLabel(h, m = 0) {
  return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function mkId() {
  return Math.random().toString(36).slice(2, 9);
}

function isOverlapping(newAppt, appointmentsList) {
  return appointmentsList.some((a) => {
    if (a.id === newAppt.id) return false;
    if (a.resourceId !== newAppt.resourceId) return false;
    return (
      (newAppt.start >= a.start && newAppt.start < a.end) ||
      (newAppt.end > a.start && newAppt.end <= a.end) ||
      (newAppt.start <= a.start && newAppt.end >= a.end)
    );
  });
}

const Modal = ({ children, onClose }) =>
  ReactDOM.createPortal(
    React.createElement(
      "div",
      {
        onClick: onClose,
        style: {
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      },
      React.createElement(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: {
            background: "#fff",
            borderRadius: 10,
            maxWidth: 400,
            width: "100%",
            padding: 20,
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto",
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            color: "#222",
          },
        },
        children
      )
    ),
    document.body
  );

export default function AppointmentPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [resources, setResources] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const colRefs = useRef({});
  const timeRulerRef = useRef(null);
  const mainColumnsRef = useRef(null);

  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [newApptInfo, setNewApptInfo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAppt, setDetailAppt] = useState(null);

  const moveDay = (delta) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const slotCount = totalMinutes / SLOT_MINUTES;

  const timeSlots = useMemo(() => {
    const out = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) out.push({ h, m });
    }
    return out;
  }, []);

  useEffect(() => {
    setResources([
      { id: "doc-1", name: "Dr. Smith", color: "#e3f2fd", dot: "#2196f3" },
      { id: "doc-2", name: "Dr. Johnson", color: "#e0f7fa", dot: "#00bcd4" },
      { id: "doc-3", name: "Dr. Patel", color: "#fce4ec", dot: "#e91e63" },
      { id: "doc-4", name: "Dr. Liu", color: "#fff8e1", dot: "#ffc107" },
    ]);
    const d = new Date(currentDate);
    const at = (h, m) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
    setAppointments([
      {
        id: mkId(),
        title: "Initial Consult",
        start: at(9, 0),
        end: at(9, 45),
        resourceId: "doc-1",
        client: "John Doe",
      },
      {
        id: mkId(),
        title: "Follow-up",
        start: at(10, 30),
        end: at(11, 15),
        resourceId: "doc-2",
        client: "Jane Smith",
      },
      {
        id: mkId(),
        title: "New Patient",
        start: at(13, 0),
        end: at(14, 0),
        resourceId: "doc-3",
        client: "A. Iyer",
      },
      {
        id: mkId(),
        title: "Therapy",
        start: at(15, 30),
        end: at(16, 30),
        resourceId: "doc-4",
        client: "P. Kumar",
      },
    ]);
  }, [currentDate]);

  const onDragStart = (e, appt) => {
    const duration = Math.max(15, (appt.end - appt.start) / 60000);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ id: appt.id, duration, offsetY })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOverCol = (e) => e.preventDefault();

  const applyMove = (id, resourceId, clientY, offsetY) => {
    const col = colRefs.current[resourceId];
    if (!col) return;
    const rect = col.getBoundingClientRect();

    const y = clientY - rect.top - offsetY;
    const minsFromTop = floorSnapTo((y / SLOT_HEIGHT) * SLOT_MINUTES);
    const clamped = clamp(minsFromTop, 0, totalMinutes - SLOT_MINUTES);
    const startH = Math.floor(clamped / 60) + START_HOUR;
    const startM = clamped % 60;

    return { startH, startM };
  };

  const onDropOnCol = (e, resourceId) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (!payload) return;
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      return;
    }
    const { id, duration, offsetY } = parsed;
    const pos = applyMove(id, resourceId, e.clientY, offsetY);
    if (!pos) return;

    const newStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      pos.startH,
      pos.startM
    );
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    const dayEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      END_HOUR,
      0
    );
    const finalEnd = newEnd > dayEnd ? dayEnd : newEnd;
    const finalStart = new Date(finalEnd.getTime() - duration * 60000);

    const proposed = { id, resourceId, start: finalStart, end: finalEnd };
    if (isOverlapping(proposed, appointments)) {
      alert("Cannot move: appointment overlaps an existing appointment.");
      return;
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, resourceId, start: finalStart, end: finalEnd } : a
      )
    );
  };

  const startResize = (e, id, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    const initStart = new Date(appt.start),
      initEnd = new Date(appt.end);

    const onMove = (ev) => {
      const deltaPx = ev.clientY - startY;
      const deltaMins = snapTo((deltaPx / SLOT_HEIGHT) * SLOT_MINUTES);
      let newStart = new Date(initStart),
        newEnd = new Date(initEnd);

      if (direction === "top") {
        newStart = new Date(initStart.getTime() + deltaMins * 60000);
        if (newStart >= newEnd)
          newStart = new Date(newEnd.getTime() - SLOT_MINUTES * 60000);
        const dayStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          START_HOUR,
          0
        );
        if (newStart < dayStart) newStart = dayStart;
      } else {
        newEnd = new Date(initEnd.getTime() + deltaMins * 60000);
        if (newEnd <= newStart)
          newEnd = new Date(newStart.getTime() + SLOT_MINUTES * 60000);
        const dayEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          END_HOUR,
          0
        );
        if (newEnd > dayEnd) newEnd = dayEnd;
      }

      const snapEdge = (d) => {
        const mins = floorSnapTo(minutesSinceStart(d));
        const H = Math.floor(mins / 60) + START_HOUR;
        const M = mins % 60;
        return new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          H,
          M
        );
      };

      if (direction === "top") newStart = snapEdge(newStart);
      else newEnd = snapEdge(newEnd);

      const proposed = {
        id,
        resourceId: appt.resourceId,
        start: direction === "top" ? newStart : appt.start,
        end: direction === "bottom" ? newEnd : appt.end,
      };

      if (isOverlapping(proposed, appointments)) {
        return;
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                start: direction === "top" ? newStart : a.start,
                end: direction === "bottom" ? newEnd : a.end,
              }
            : a
        )
      );
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onDoubleClickCol = (e, resourceId) => {
    const col = colRefs.current[resourceId];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minsFromTop = floorSnapTo((y / SLOT_HEIGHT) * SLOT_MINUTES);
    const clamped = clamp(minsFromTop, 0, totalMinutes - SLOT_MINUTES);
    const h = Math.floor(clamped / 60) + START_HOUR;
    const m = clamped % 60;
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      h,
      m
    );
    const end = new Date(start.getTime() + SLOT_MINUTES * 60000);
    setNewApptInfo({ resourceId, start, end });
    setShowNewApptModal(true);
  };

  const onClickAppointment = (appt) => {
    setDetailAppt(appt);
    setShowDetailModal(true);
  };

  const saveNewAppointment = ({ title, client }) => {
    if (!title || !client) {
      alert("Please enter a title and client name.");
      return;
    }
    const newAppt = {
      id: mkId(),
      title,
      client,
      resourceId: newApptInfo.resourceId,
      start: newApptInfo.start,
      end: newApptInfo.end,
    };
    if (isOverlapping(newAppt, appointments)) {
      alert("Cannot create: appointment overlaps an existing appointment.");
      return;
    }
    setAppointments((prev) => [...prev, newAppt]);
    setShowNewApptModal(false);
    setNewApptInfo(null);
  };

  const closeNewApptModal = () => {
    setShowNewApptModal(false);
    setNewApptInfo(null);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailAppt(null);
  };

  const NewAppointmentForm = () => {
    const [title, setTitle] = useState("");
    const [client, setClient] = useState("");

    return React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        {
          style: {
            marginTop: 0,
            marginBottom: 10,
            fontFamily: "Arial, sans-serif",
          },
        },
        "New Appointment"
      ),
      React.createElement(
        "div",
        { style: { marginBottom: 10 } },
        React.createElement(
          "label",
          null,
          "Title:",
          React.createElement("br", null),
          React.createElement("input", {
            type: "text",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            style: {
              width: "100%",
              padding: 6,
              fontSize: 14,
              fontFamily: "Arial, sans-serif",
            },
          })
        )
      ),
      React.createElement(
        "div",
        { style: { marginBottom: 10 } },
        React.createElement(
          "label",
          null,
          "Client:",
          React.createElement("br", null),
          React.createElement("input", {
            type: "text",
            value: client,
            onChange: (e) => setClient(e.target.value),
            style: {
              width: "100%",
              padding: 6,
              fontSize: 14,
              fontFamily: "Arial, sans-serif",
            },
          })
        )
      ),
      React.createElement(
        "div",
        { style: { marginTop: 20, textAlign: "right" } },
        React.createElement(
          "button",
          {
            onClick: closeNewApptModal,
            style: {
              marginRight: 10,
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
            },
          },
          "Cancel"
        ),
        React.createElement(
          "button",
          {
            onClick: () =>
              saveNewAppointment({
                title: title.trim(),
                client: client.trim(),
              }),
            style: {
              padding: "6px 12px",
              borderRadius: 4,
              border: "none",
              backgroundColor: "#2196f3",
              color: "white",
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
            },
          },
          "Save"
        )
      )
    );
  };

  const AppointmentDetail = ({ appt }) =>
    React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        {
          style: {
            marginTop: 0,
            marginBottom: 10,
            fontFamily: "Arial, sans-serif",
          },
        },
        "Appointment Details"
      ),
      React.createElement(
        "div",
        null,
        React.createElement("b", null, "Title:"),
        " ",
        appt.title
      ),
      React.createElement(
        "div",
        null,
        React.createElement("b", null, "Client:"),
        " ",
        appt.client || "N/A"
      ),
      React.createElement(
        "div",
        null,
        React.createElement("b", null, "Time:"),
        " ",
        timeLabel(appt.start.getHours(), appt.start.getMinutes()),
        " — ",
        timeLabel(appt.end.getHours(), appt.end.getMinutes())
      ),
      React.createElement(
        "div",
        null,
        React.createElement("b", null, "Resource:"),
        " ",
        (resources.find((r) => r.id === appt.resourceId) || {}).name ||
          appt.resourceId
      ),
      React.createElement(
        "div",
        { style: { marginTop: 20, textAlign: "right" } },
        React.createElement(
          "button",
          {
            onClick: closeDetailModal,
            style: {
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: "#f9f9f9",
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
            },
          },
          "Close"
        )
      )
    );

  useEffect(() => {
    const timeElem = timeRulerRef.current;
    const mainElem = mainColumnsRef.current;
    if (!timeElem || !mainElem) return;
    const syncScroll = () => {
      timeElem.scrollTop = mainElem.scrollTop;
    };
    mainElem.addEventListener("scroll", syncScroll);
    return () => mainElem.removeEventListener("scroll", syncScroll);
  }, []);

  // Helper functions to render elements
  function renderToolbar() {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid #e0e7ef",
          background: "#e3f2fd",
          fontWeight: 700,
          fontSize: 14,
          color: "#222",
          userSelect: "none",
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => moveDay(-1),
            style: {
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              background: "#fff",
              cursor: "pointer",
            },
            "aria-label": "Previous day",
          },
          "\u2190"
        ),
        React.createElement(
          "div",
          null,
          currentDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => moveDay(1),
            style: {
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              background: "#fff",
              cursor: "pointer",
            },
            "aria-label": "Next day",
          },
          "\u2192"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setCurrentDate(new Date()),
            style: {
              marginLeft: 12,
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              background: "#e0e7ef",
              cursor: "pointer",
            },
            "aria-label": "Today",
          },
          "Today"
        )
      ),
      React.createElement(
        "div",
        { style: { fontSize: 13, fontWeight: 500, color: "#555" } },
        "Drag to move \u2022 Drag edges to resize \u2022 Double-click to add \u2022 Click appointment"
      )
    );
  }

  function renderTimeRuler() {
    return React.createElement(
      "div",
      {
        ref: timeRulerRef,
        style: {
          borderRight: "1px solid #e0e7ef",
          background: "#f8fafc",
          position: "relative",
          overflowY: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          userSelect: "none",
        },
        onScroll: () => {},
      },
      React.createElement("div", {
        style: { height: HEADER_H, borderBottom: "1px solid #e0e7ef" },
      }),
      timeSlots.map(({ h, m }, i) =>
        React.createElement(
          "div",
          {
            key: i,
            style: {
              height: SLOT_HEIGHT,
              borderBottom: "1px dashed #e0e7ef",
              paddingRight: 8,
              textAlign: "right",
              fontSize: 11,
              color: "#789",
              display: "flex",
              alignItems: "flex-start",
              userSelect: "none",
            },
          },
          m === 0 || m === 30
            ? React.createElement(
                "span",
                { style: { transform: "translateY(-2px)", width: "100%" } },
                timeLabel(h, m)
              )
            : null
        )
      )
    );
  }

  function renderAppointmentsForResource(r) {
    const appts = appointments.filter((a) => a.resourceId === r.id);
    return appts.map((a) => {
      const minsTop = clamp(minutesSinceStart(a.start), 0, totalMinutes);
      const topPx = (minsTop / SLOT_MINUTES) * SLOT_HEIGHT;
      const durMins = Math.max(15, (a.end - a.start) / 60000);
      const heightPx = Math.max(16, (durMins / SLOT_MINUTES) * SLOT_HEIGHT);
      return React.createElement(
        "div",
        {
          key: a.id,
          draggable: true,
          onDragStart: (e) => onDragStart(e, a),
          onClick: () => onClickAppointment(a),
          role: "button",
          tabIndex: 0,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") onClickAppointment(a);
          },
          style: {
            position: "absolute",
            left: 8,
            right: 8,
            top: topPx,
            height: heightPx,
            borderRadius: 7,
            border: "1px solid #bcd",
            background: r.color || "#e2eafc",
            boxShadow: "0 2px 10px #b9eafb77",
            cursor: "grab",
            userSelect: "none",
            zIndex: 20,
            outline: "none",
            padding: "8px 10px 6px",
            color: "#125",
            fontFamily: "Arial, sans-serif",
          },
          title:
            a.title +
            "\n" +
            timeLabel(a.start.getHours(), a.start.getMinutes()) +
            " — " +
            timeLabel(a.end.getHours(), a.end.getMinutes()),
        },
        // Resize handles top and bottom bars
        React.createElement("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: -2,
            height: 8,
            cursor: "ns-resize",
            zIndex: 21,
          },
          onMouseDown: (e) => startResize(e, a.id, "top"),
        }),
        React.createElement("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -2,
            height: 8,
            cursor: "ns-resize",
            zIndex: 21,
          },
          onMouseDown: (e) => startResize(e, a.id, "bottom"),
        }),
        React.createElement(
          "div",
          {
            style: {
              fontWeight: "bold",
              fontSize: 13,
              marginBottom: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          },
          a.title
        ),
        React.createElement(
          "div",
          { style: { fontSize: 12, color: "#345" } },
          timeLabel(a.start.getHours(), a.start.getMinutes()),
          " — ",
          timeLabel(a.end.getHours(), a.end.getMinutes())
        ),
        a.client
          ? React.createElement(
              "div",
              {
                style: {
                  fontSize: 12,
                  color: "#567",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              },
              "Client: ",
              a.client
            )
          : null
      );
    });
  }

  function renderResourceColumns() {
    return React.createElement(
      "div",
      {
        style: {
          display: "grid",
          position: "relative",
          gridTemplateColumns: `repeat(${resources.length}, minmax(0,1fr))`,
          minHeight: slotCount * SLOT_HEIGHT,
          background: "#f9fafb",
          height: "100%",
          userSelect: "none",
        },
      },
      resources.length
        ? resources.map((r) =>
            React.createElement(
              "div",
              {
                key: r.id,
                ref: (el) => (colRefs.current[r.id] = el),
                style: {
                  position: "relative",
                  borderRight: "1px solid #e0e7ef",
                  background: "#fff",
                },
                onDragOver: onDragOverCol,
                onDrop: (e) => onDropOnCol(e, r.id),
                onDoubleClick: (e) => onDoubleClickCol(e, r.id),
                title: "Double-click empty space to add appointment",
              },
              // Empty slots
              Array.from({ length: slotCount }).map((_, i) =>
                React.createElement("div", {
                  key: i,
                  style: {
                    height: SLOT_HEIGHT,
                    borderBottom: "1px solid #f6f8fa",
                  },
                })
              ),
              // Render appointments
              renderAppointmentsForResource(r)
            )
          )
        : React.createElement(
            "div",
            { style: { padding: 20 } },
            "Loading resources..."
          )
    );
  }

  function renderStickyHeader() {
    return React.createElement(
      "div",
      {
        style: {
          display: "grid",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#fff",
          borderBottom: "1px solid #e0e7ef",
          gridTemplateColumns: `repeat(${
            resources.length || 1
          }, minmax(0,1fr))`,
          height: HEADER_H,
          userSelect: "none",
        },
      },
      (resources.length
        ? resources
        : [{ id: "loading", name: "Loading..." }]
      ).map((r, i) =>
        React.createElement(
          "div",
          {
            key: r.id + "_" + i,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "#345",
              borderRight:
                i === resources.length - 1 ? "none" : "1px solid #e0e7ef",
              height: "100%",
              userSelect: "none",
            },
          },
          React.createElement(
            "span",
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              },
            },
            React.createElement("span", {
              style: {
                height: 14,
                width: 14,
                borderRadius: 7,
                display: "inline-block",
                background: r.dot || "#789",
              },
            }),
            r.name
          )
        )
      )
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    showNewApptModal &&
      React.createElement(
        Modal,
        { onClose: closeNewApptModal },
        React.createElement(NewAppointmentForm, null)
      ),
    showDetailModal &&
      detailAppt &&
      React.createElement(
        Modal,
        { onClose: closeDetailModal },
        React.createElement(AppointmentDetail, { appt: detailAppt })
      ),
    React.createElement(
      "div",
      {
        style: {
          minHeight: "100vh",
          background: "#f8fafc",
          padding: 18,
          fontFamily: "Arial, sans-serif",
          userSelect: "none",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
      React.createElement(
        "div",
        {
          style: {
            height: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            borderRadius: 18,
            border: "1px solid #e0e7ef",
            background: "#fff",
            boxShadow: "0 2px 16px #e3f2fd88",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
        renderToolbar(),
        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "100px 1fr",
              height: "calc(100vh - 80px)",
            },
          },
          renderTimeRuler(),
          React.createElement(
            "div",
            {
              ref: mainColumnsRef,
              style: {
                overflowY: "scroll",
                position: "relative",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                userSelect: "none",
              },
            },
            renderStickyHeader(),
            renderResourceColumns()
          )
        )
      )
    )
  );
}
