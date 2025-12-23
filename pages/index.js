import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const COST = {
  priest: 500,
  scholar: 180,
  tactician: 220
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("priest");
  const [resource, setResource] = useState(0);
  const [speed, setSpeed] = useState({ general: 0, build: 0, tech: 0, train: 0 });
  const [effective, setEffective] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    calculate();
  }, [resource, speed, role]);

  function calculate() {
    let days = 0;
    if (role === "priest") days = speed.general + speed.build;
    if (role === "scholar") days = speed.general + speed.tech;
    if (role === "tactician") days = speed.general + speed.train;

    const maxDays = Math.floor(resource / COST[role]);
    setEffective(Math.min(days, maxDays));
  }

  async function loadSchedule() {
    const { data } = await supabase.from("schedules").select("*").order("hour");
    setSchedule(data || []);
  }

  async function submit() {
    if (selectedHour === null) return alert("請選擇時間");

    const target = schedule.find(s => s.hour === selectedHour && s.role === role);

    if (!target || effective > (target.effective_days || 0)) {
      await supabase.from("schedules").update({
        user_uid: user.uid,
        game_name: user.game_name,
        effective_days: effective
      }).eq("hour", selectedHour).eq("role", role);

      await loadSchedule();
      alert("申請成功，班表已更新");
    } else {
      alert("有效天數不足，無法覆蓋");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>官職申請系統</h2>

      <h3>官職選擇</h3>
      <select onChange={e => setRole(e.target.value)}>
        <option value="priest">大祭司</option>
        <option value="scholar">賢者</option>
        <option value="tactician">戰術大師</option>
      </select>

      <h3>資源（萬）</h3>
      <input type="number" onChange={e => setResource(+e.target.value)} />

      <h3>加速（天）</h3>
      <input placeholder="通用" onChange={e => setSpeed({ ...speed, general:+e.target.value })}/>
      <input placeholder="建築" onChange={e => setSpeed({ ...speed, build:+e.target.value })}/>
      <input placeholder="科技" onChange={e => setSpeed({ ...speed, tech:+e.target.value })}/>
      <input placeholder="訓練" onChange={e => setSpeed({ ...speed, train:+e.target.value })}/>

      <h3>有效天數：{effective}</h3>

      <h3>班表</h3>
      {schedule.filter(s => s.role === role).map(s => (
        <div key={s.hour}
          style={{
            padding: 8,
            margin: 4,
            background: selectedHour === s.hour ? "#ffeaa7" : "#eee",
            cursor: "pointer"
          }}
          onClick={() => setSelectedHour(s.hour)}
        >
          {s.hour}:00 - {s.game_name || "空"} ({s.effective_days || 0})
        </div>
      ))}

      <button onClick={submit}>送出</button>
    </div>
  );
}
