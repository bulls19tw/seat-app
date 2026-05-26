import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // --- 狀態管理 (States) ---
  const [isAdmin, setIsAdmin] = useState(false); 
  const [isPreviewMode, setIsPreviewMode] = useState(false); 
  const [isPublished, setIsPublished] = useState(false);
  const [zoom, setZoom] = useState(1); 

  const defaultAccounts = [{ username: 'admin', password: '1234', role: 'super' }];
  const [accounts, setAccounts] = useState(defaultAccounts);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [newAccUser, setNewAccUser] = useState('');
  const [newAccPass, setNewAccPass] = useState('');

  const [units, setUnits] = useState([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAdultMeat, setNewUnitAdultMeat] = useState(0);
  const [newUnitAdultVeg, setNewUnitAdultVeg] = useState(0);
  const [newUnitChildMeat, setNewUnitChildMeat] = useState(0);
  const [newUnitChildVeg, setNewUnitChildVeg] = useState(0);

  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitAdultMeat, setEditUnitAdultMeat] = useState(0);
  const [editUnitAdultVeg, setEditUnitAdultVeg] = useState(0);
  const [editUnitChildMeat, setEditUnitChildMeat] = useState(0);
  const [editUnitChildVeg, setEditUnitChildVeg] = useState(0);

  const [tables, setTables] = useState([]);
  const [drawings, setDrawings] = useState([]); 
  const [tableCapacity, setTableCapacity] = useState(10);
  
  const [draggedId, setDraggedId] = useState(null);
  const [draggedSeat, setDraggedSeat] = useState(null); 
  
  const [resizingId, setResizingId] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const fileInputRef = useRef(null);

  // 版權宣告元件
  const FooterCopyright = () => (
    <div className="text-center py-6 text-gray-400 text-[11px] mt-auto print:hidden">
      © 2026 文康活動座位管理系統 • 阿信的Gemini Canvas實驗室
    </div>
  );

  // --- 動態設定網頁標題與圖示 (強制覆寫 Vite 預設) ---
  useEffect(() => {
    document.title = '文康活動座位管理系統';
    const updateFavicon = () => {
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.parentNode.removeChild(link));
      const link = document.createElement('link');
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="15" r="12" fill="%233b82f6" /><circle cx="50" cy="85" r="12" fill="%2322c55e" /><circle cx="15" cy="50" r="12" fill="%233b82f6" /><circle cx="85" cy="50" r="12" fill="%2322c55e" /><circle cx="50" cy="50" r="28" fill="%23ffedd5" stroke="%23fdba74" stroke-width="6" /></svg>';
      document.head.appendChild(link);
    };
    updateFavicon();
    setTimeout(updateFavicon, 500); // 延遲執行一次確保不被蓋掉
  }, []);

  // --- 載入與儲存本地資料 ---
  useEffect(() => {
    const savedData = localStorage.getItem('seatArrangementData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.units) {
          setUnits(parsed.units.map(u => ({
            ...u, adultMeat: u.adultMeat ?? u.count ?? 0, adultVeg: u.adultVeg ?? 0, childMeat: u.childMeat ?? 0, childVeg: u.childVeg ?? 0,
            count: (u.adultMeat ?? u.count ?? 0) + (u.adultVeg ?? 0) + (u.childMeat ?? 0) + (u.childVeg ?? 0)
          })));
        }
        if (parsed.tables) {
          setTables(parsed.tables.map(t => {
            let normalizedSeats = Array(t.capacity || 10).fill(null);
            if (t.seats) { t.seats.forEach((seat, idx) => { if (idx < normalizedSeats.length) normalizedSeats[idx] = seat; }); }
            return { ...t, type: t.type || 'normal', isDisbanded: t.isDisbanded || false, seats: normalizedSeats };
          }));
        }
        if (parsed.drawings) setDrawings(parsed.drawings);
        if (parsed.isPublished !== undefined) setIsPublished(parsed.isPublished);
      } catch (e) {
        console.error('讀取本地資料失敗');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('seatArrangementData', JSON.stringify({ units, tables, drawings, isPublished, accounts }));
  }, [units, tables, drawings, isPublished, accounts]);

  // --- 圖形縮放監聽事件 ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingId) return;
      const dx = (e.clientX - resizeStart.x) / zoom;
      const dy = (e.clientY - resizeStart.y) / zoom;
      setDrawings(prev => prev.map(d => {
        if (d.id === resizingId) return { ...d, width: Math.max(50, resizeStart.w + dx), height: Math.max(30, resizeStart.h + dy) };
        return d;
      }));
    };
    const handleMouseUp = () => { if (resizingId) setResizingId(null); };

    if (resizingId) {
      window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingId, resizeStart, zoom]);

  // --- 計算待分配人員清單 (Unassigned Pool) ---
  const unassignedList = [];
  units.forEach(u => {
    let am = u.adultMeat || 0, av = u.adultVeg || 0, cm = u.childMeat || 0, cv = u.childVeg || 0;
    tables.forEach(t => {
      t.seats.forEach(s => {
        if (s && s.unitId === u.id) {
          if (s.seatType === 'adultMeat') am--;
          if (s.seatType === 'adultVeg') av--;
          if (s.seatType === 'childMeat') cm--;
          if (s.seatType === 'childVeg') cv--;
        }
      });
    });
    for(let i=0; i<am; i++) unassignedList.push({ unitId: u.id, unitName: u.name, seatType: 'adultMeat' });
    for(let i=0; i<av; i++) unassignedList.push({ unitId: u.id, unitName: u.name, seatType: 'adultVeg' });
    for(let i=0; i<cm; i++) unassignedList.push({ unitId: u.id, unitName: u.name, seatType: 'childMeat' });
    for(let i=0; i<cv; i++) unassignedList.push({ unitId: u.id, unitName: u.name, seatType: 'childVeg' });
  });

  // --- 帳號與登入功能 ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = accounts.find(a => a.username === loginUser && a.password === loginPass);
    if (user) {
      setCurrentUser({ username: user.username, role: user.role });
      setIsAdmin(true); setShowLoginModal(false); setLoginUser(''); setLoginPass(''); setZoom(1);
    } else alert('帳號或密碼錯誤！');
  };

  const handleLogout = () => {
    setCurrentUser(null); setIsAdmin(false); setIsPreviewMode(false); setZoom(1);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const user = accounts.find(a => a.username === currentUser.username);
    if (user.password !== oldPass) return alert('舊密碼錯誤！');
    if (newPass !== confirmPass) return alert('兩次輸入的新密碼不一致！');
    if (!newPass.trim()) return alert('密碼不能為空！');
    setAccounts(accounts.map(a => a.username === currentUser.username ? { ...a, password: newPass } : a));
    alert('密碼修改成功！');
    setShowPasswordModal(false); setOldPass(''); setNewPass(''); setConfirmPass('');
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccUser.trim() || !newAccPass.trim()) return alert('帳號密碼不能為空！');
    if (accounts.some(a => a.username === newAccUser)) return alert('帳號已存在！');
    setAccounts([...accounts, { username: newAccUser, password: newAccPass, role: 'user' }]);
    setNewAccUser(''); setNewAccPass('');
  };

  const handleDeleteAccount = (username) => {
    if (username === 'admin') return alert('系統預設 admin 帳號不可刪除！');
    if (window.confirm(`確定要刪除帳號「${username}」嗎？`)) setAccounts(accounts.filter(a => a.username !== username));
  };

  // --- 單位管理功能 ---
  const addUnit = () => {
    if (!newUnitName.trim()) return;
    const totalCount = newUnitAdultMeat + newUnitAdultVeg + newUnitChildMeat + newUnitChildVeg;
    if (totalCount <= 0) return alert("請至少輸入一位參加人員！");
    setUnits([...units, { id: Date.now().toString(), name: newUnitName, adultMeat: newUnitAdultMeat, adultVeg: newUnitAdultVeg, childMeat: newUnitChildMeat, childVeg: newUnitChildVeg, count: totalCount, assigned: 0 }]);
    setNewUnitName(''); setNewUnitAdultMeat(0); setNewUnitAdultVeg(0); setNewUnitChildMeat(0); setNewUnitChildVeg(0);
  };
  const deleteUnit = (id) => setUnits(units.filter(u => u.id !== id));
  const startEditUnit = (unit) => {
    setEditingUnitId(unit.id); setEditUnitName(unit.name); setEditUnitAdultMeat(unit.adultMeat || 0); setEditUnitAdultVeg(unit.adultVeg || 0); setEditUnitChildMeat(unit.childMeat || 0); setEditUnitChildVeg(unit.childVeg || 0);
  };
  const saveEditUnit = () => {
    if (!editUnitName.trim()) return;
    const totalCount = editUnitAdultMeat + editUnitAdultVeg + editUnitChildMeat + editUnitChildVeg;
    if (totalCount <= 0) return alert("總人數不能為 0！");
    setUnits(units.map(u => u.id === editingUnitId ? { ...u, name: editUnitName, adultMeat: editUnitAdultMeat, adultVeg: editUnitAdultVeg, childMeat: editUnitChildMeat, childVeg: editUnitChildVeg, count: totalCount } : u));
    setEditingUnitId(null);
  };

  // --- 桌次與繪圖功能 ---
  const addTable = (type = 'normal') => {
    setTables([...tables, { id: `table-${Date.now()}`, x: 100 + (tables.length * 20) % 300, y: 100 + (tables.length * 20) % 300, capacity: tableCapacity, type: type, isDisbanded: false, seats: Array(tableCapacity).fill(null) }]);
  };
  const clearTables = () => { if(window.confirm('確定要「連同桌子與圖形」全部清空嗎？')) { setTables([]); setDrawings([]); } };
  const clearSeatsOnly = () => { if(window.confirm('確定要將所有人「移出座位」嗎？(保留現有桌子)')) { setTables(tables.map(t => ({...t, seats: Array(t.capacity).fill(null)}))); } };
  const toggleTableDisband = (tableId) => setTables(tables.map(t => t.id === tableId ? { ...t, isDisbanded: !t.isDisbanded } : t));

  const addDrawing = (type) => {
    const newId = `draw-${Date.now()}`;
    let width = 100, height = 100, text = '', bgColor = 'bg-gray-300';
    if (type === 'stage') { width = 400; height = 100; text = '舞台'; bgColor = 'bg-gray-800 text-white'; }
    if (type === 'pillar') { width = 80; height = 80; text = '柱子'; bgColor = 'bg-gray-400 text-white'; }
    if (type === 'text') { width = 150; height = 40; text = ''; bgColor = 'bg-transparent text-gray-800'; }
    setDrawings([...drawings, { id: newId, type, x: 150, y: 150, width, height, text, bgColor }]);
  };
  const updateDrawingText = (id, newText) => setDrawings(drawings.map(d => d.id === id ? { ...d, text: newText } : d));
  const deleteDrawing = (id) => setDrawings(drawings.filter(d => d.id !== id));

  // --- 智能團聚排位演算法 (不破壞現有座位) ---
  const autoAssign = () => {
    if (unassignedList.length === 0) return alert('目前沒有需要分配的人員！');
    
    // 只更動空位，不洗掉原本已經坐好的人
    let newTables = tables.map(t => ({ ...t, seats: [...t.seats] }));
    let totalTablesCount = newTables.length;
    let normalGroups = {}; let childGroups = {};

    unassignedList.forEach(seat => {
      if (seat.seatType.includes('child')) {
         if (!childGroups[seat.unitId]) childGroups[seat.unitId] = [];
         childGroups[seat.unitId].push(seat);
      } else {
         if (!normalGroups[seat.unitId]) normalGroups[seat.unitId] = [];
         normalGroups[seat.unitId].push(seat);
      }
    });

    const getNextPos = (index) => ({ x: 100 + (index % 6) * 220, y: 300 + Math.floor(index / 6) * 220 });

    const allocateGroups = (groupsObj, tableType) => {
      let existingTables = newTables.filter(t => t.type === tableType);
      const groups = Object.values(groupsObj);
      
      for (let group of groups) {
        let remainingToPlace = group.length;
        while (remainingToPlace > 0) {
           let bestTable = existingTables.find(t => t.seats.filter(s => s === null).length >= remainingToPlace) || existingTables.find(t => t.seats.filter(s => s === null).length > 0);
           if (!bestTable) {
              bestTable = { id: `table-auto-${tableType}-${Date.now()}-${totalTablesCount}`, x: getNextPos(totalTablesCount).x, y: getNextPos(totalTablesCount).y, capacity: tableCapacity, type: tableType, isDisbanded: false, seats: Array(tableCapacity).fill(null) };
              newTables.push(bestTable); existingTables.push(bestTable); totalTablesCount++;
           }
           let toPlace = Math.min(bestTable.seats.filter(s => s === null).length, remainingToPlace);
           let groupSlice = group.slice(group.length - remainingToPlace, group.length - remainingToPlace + toPlace);
           let sliceIndex = 0;
           for (let i = 0; i < bestTable.capacity; i++) {
              if (bestTable.seats[i] === null && sliceIndex < toPlace) { bestTable.seats[i] = groupSlice[sliceIndex]; sliceIndex++; }
           }
           remainingToPlace -= toPlace;
        }
      }
    };
    allocateGroups(normalGroups, 'normal'); allocateGroups(childGroups, 'child');
    setTables(newTables);
    alert('已將「待分配人員」自動排入空位（不足的桌數已自動補齊）！');
  };

  // --- 畫布與座位拖曳處理 ---
  const handleDragStart = (e, id) => {
    setDraggedId(id); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e) => {
    e.preventDefault(); if (!draggedId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom; const y = (e.clientY - rect.top) / zoom;
    if (draggedId.startsWith('table-')) setTables(tables.map(t => t.id === draggedId ? { ...t, x: Math.max(0, x - 48), y: Math.max(0, y - 48) } : t));
    else if (draggedId.startsWith('draw-')) setDrawings(drawings.map(d => d.id === draggedId ? { ...d, x: Math.max(0, x - d.width/2), y: Math.max(0, y - d.height/2) } : d));
    setDraggedId(null);
  };

  // 單一座位拖曳 (包含從待分配區拖出)
  const handleSeatDragStart = (e, tableId, seatIndex) => {
    e.stopPropagation(); setDraggedSeat({ tableId, seatIndex });
    e.dataTransfer.setData('text/plain', `seat-${tableId}-${seatIndex}`); e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(e.target, e.target.offsetWidth / 2, e.target.offsetHeight / 2);
  };
  
  const handleUnassignedDragStart = (e, seat) => {
    e.stopPropagation(); setDraggedSeat({ isUnassigned: true, ...seat });
    e.dataTransfer.setData('text/plain', 'unassigned'); e.dataTransfer.effectAllowed = 'move';
    if (e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(e.target, e.target.offsetWidth / 2, e.target.offsetHeight / 2);
  };

  const handleSeatDrop = (e, targetTableId, targetSeatIndex) => {
    e.preventDefault(); e.stopPropagation();
    if (!draggedSeat) return;
    setTables(prevTables => {
      if (draggedSeat.isUnassigned) {
        return prevTables.map(t => {
           if (t.id === targetTableId) {
              const newSeats = [...t.seats];
              newSeats[targetSeatIndex] = { unitId: draggedSeat.unitId, unitName: draggedSeat.unitName, seatType: draggedSeat.seatType };
              return { ...t, seats: newSeats };
           }
           return t;
        });
      } else {
        const { tableId: sId, seatIndex: sIdx } = draggedSeat;
        return prevTables.map(t => {
          if (t.id === sId && t.id === targetTableId) {
            const newSeats = [...t.seats]; const temp = newSeats[sIdx]; newSeats[sIdx] = newSeats[targetSeatIndex]; newSeats[targetSeatIndex] = temp; return { ...t, seats: newSeats };
          } else if (t.id === sId) {
            const newSeats = [...t.seats]; newSeats[sIdx] = prevTables.find(tbl => tbl.id === targetTableId).seats[targetSeatIndex]; return { ...t, seats: newSeats };
          } else if (t.id === targetTableId) {
            const newSeats = [...t.seats]; newSeats[targetSeatIndex] = prevTables.find(tbl => tbl.id === sId).seats[sIdx]; return { ...t, seats: newSeats };
          }
          return t;
        });
      }
    });
    setDraggedSeat(null);
  };

  // 從桌子將人拖曳回「待分配區」
  const handleUnassignedDrop = (e) => {
    e.preventDefault();
    if (draggedSeat && !draggedSeat.isUnassigned) {
       setTables(tables.map(t => {
          if (t.id === draggedSeat.tableId) {
             const newSeats = [...t.seats];
             newSeats[draggedSeat.seatIndex] = null;
             return { ...t, seats: newSeats };
          }
          return t;
       }));
    }
    setDraggedSeat(null);
  };

  // --- 檔案匯出/載入 ---
  const exportData = () => {
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify({ units, tables, drawings, isPublished, accounts }));
    const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', 'seat-arrangement-backup.json'); linkElement.click();
  };
  const importData = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.units) setUnits(parsed.units);
        if (parsed.tables) setTables(parsed.tables);
        if (parsed.drawings) setDrawings(parsed.drawings);
        if (parsed.isPublished !== undefined) setIsPublished(parsed.isPublished);
        alert("載入成功！");
      } catch (error) { alert("檔案格式錯誤！"); }
    };
    reader.readAsText(file); event.target.value = ''; 
  };
  const importCSVData = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = e.target.result.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length < 2) return alert('CSV 檔案格式不正確或沒有資料列。');
      const headers = rows[0].split(',');
      const nameIdx = headers.findIndex(h => h.includes('單位') || h.includes('名稱') || h.includes('處室') || h.includes('學年'));
      const amIdx = headers.findIndex(h => h.includes('大人葷') || (h.includes('大人') && !h.includes('素')));
      const avIdx = headers.findIndex(h => h.includes('大人素') || h.includes('素食'));
      const cmIdx = headers.findIndex(h => h.includes('小孩葷') || (h.includes('小孩') && !h.includes('素')));
      const cvIdx = headers.findIndex(h => h.includes('小孩素'));
      const oldTotalIdx = headers.findIndex(h => h.includes('人數') || h.includes('數量'));

      if (nameIdx === -1) return alert('匯入失敗：找不到單位名稱欄位！');
      const newUnits = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const name = cols[nameIdx]?.replace(/(^"|"$)/g, '').trim();
        let am = amIdx !== -1 ? parseInt(cols[amIdx]?.replace(/(^"|"$)/g, '').trim(), 10) : 0;
        let av = avIdx !== -1 ? parseInt(cols[avIdx]?.replace(/(^"|"$)/g, '').trim(), 10) : 0;
        let cm = cmIdx !== -1 ? parseInt(cols[cmIdx]?.replace(/(^"|"$)/g, '').trim(), 10) : 0;
        let cv = cvIdx !== -1 ? parseInt(cols[cvIdx]?.replace(/(^"|"$)/g, '').trim(), 10) : 0;
        if (amIdx === -1 && avIdx === -1 && cmIdx === -1 && cvIdx === -1 && oldTotalIdx !== -1) am = parseInt(cols[oldTotalIdx]?.replace(/(^"|"$)/g, '').trim(), 10) || 0;
        am = isNaN(am) ? 0 : am; av = isNaN(av) ? 0 : av; cm = isNaN(cm) ? 0 : cm; cv = isNaN(cv) ? 0 : cv;
        const total = am + av + cm + cv;
        if (name && total > 0) newUnits.push({ id: `csv-${Date.now()}-${i}`, name, adultMeat: am, adultVeg: av, childMeat: cm, childVeg: cv, count: total, assigned: 0 });
      }
      if (newUnits.length > 0) { setUnits(prev => [...prev, ...newUnits]); alert(`✅ 成功匯入了 ${newUnits.length} 個單位資料！`); } 
      else { alert('沒有找到有效的報名資料。'); }
    };
    reader.readAsText(file, 'utf-8'); event.target.value = '';
  };

  // --- 畫布內容渲染 (共用) ---
  const renderCanvasContent = (allowEdit) => (
    <>
      {drawings.map(d => (
        <div key={d.id} draggable={allowEdit && !resizingId} onDragStart={(e) => { if(allowEdit && !resizingId) handleDragStart(e, d.id); }}
          className={`absolute flex items-center justify-center font-bold text-lg rounded shadow-sm group ${d.bgColor} ${allowEdit && !resizingId ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400' : ''}`}
          style={{ left: `${d.x}px`, top: `${d.y}px`, width: `${d.width}px`, height: `${d.height}px`, border: d.type === 'text' ? 'none' : '2px solid rgba(0,0,0,0.1)' }}
        >
          {allowEdit ? (
            <textarea value={d.text} onChange={(e) => updateDrawingText(d.id, e.target.value)}
              onFocus={(e) => { if (d.text === '請輸入標示文字') updateDrawingText(d.id, ''); else e.target.select(); }}
              placeholder={d.type === 'text' ? '請輸入標示文字' : ''}
              className={`bg-transparent text-center w-full h-full p-1 resize-none focus:outline-none placeholder-gray-400 ${!resizingId ? 'cursor-grab active:cursor-grabbing focus:cursor-text' : ''}`}
              style={{ lineHeight: `${Math.max(20, d.height - 10)}px` }}
            />
          ) : ( <span className="whitespace-pre-wrap text-center flex-1">{d.text}</span> )}
          {allowEdit && <button onClick={() => deleteDrawing(d.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center z-50">✕</button>}
          {allowEdit && (
            <div onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizingId(d.id); setResizeStart({ x: e.clientX, y: e.clientY, w: d.width, h: d.height }); }}
               className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-600 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md z-50 border-2 border-white" title="拖曳調整大小">
               <span className="text-white text-[10px] transform rotate-45 leading-none">⤡</span>
            </div>
          )}
        </div>
      ))}

      {tables.map((table, index) => {
        const isChildTable = table.type === 'child';
        const tableBg = isChildTable ? 'bg-pink-100 border-pink-300 text-pink-800' : 'bg-orange-100 border-orange-300 text-orange-800';
        const isDisbanded = table.isDisbanded;
        const unitCounts = {}; table.seats.forEach(seat => { if (seat && seat.unitName) unitCounts[seat.unitName] = (unitCounts[seat.unitName] || 0) + 1; });
        
        return (
          <div key={table.id} draggable={allowEdit && !isDisbanded} onDragStart={(e) => { if(allowEdit && !isDisbanded) handleDragStart(e, table.id); }} style={{ left: `${table.x}px`, top: `${table.y}px` }}
            className={`absolute rounded-full transition-shadow duration-200 ${(allowEdit && !isDisbanded) ? 'cursor-grab active:cursor-grabbing hover:ring-4 hover:ring-blue-300' : (allowEdit && isDisbanded ? 'ring-2 ring-dashed ring-red-400' : '')}`}
          >
            <div className={`relative w-24 h-24 ${tableBg} border-4 rounded-full flex flex-col items-center justify-center shadow-md z-10`}>
              <span className="font-bold text-sm">第 {index + 1} 桌</span>
              {isChildTable && <span className="text-[10px] font-bold opacity-80">(小孩桌)</span>}
              {allowEdit && (
                <button onClick={(e) => { e.stopPropagation(); toggleTableDisband(table.id); }}
                  className={`mt-1 px-2 py-0.5 text-[10px] border rounded shadow-sm font-medium transition-colors ${isDisbanded ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                > {isDisbanded ? '🔒 恢復綁定' : '🔓 解散調位'} </button>
              )}
            </div>
            
            {Array.from({ length: table.capacity }).map((_, i) => {
              const angle = (i / table.capacity) * 2 * Math.PI - Math.PI / 2;
              const radius = 62; const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius;
              const seatInfo = table.seats[i]; const isChild = seatInfo?.seatType?.includes('child'); const isVeg = seatInfo?.seatType?.includes('Veg'); const isFilled = !!seatInfo;
              
              let seatBgColor = '';
              if (isFilled) {
                 if (isChild) seatBgColor = isVeg ? 'bg-green-300 border-green-500 text-green-900' : 'bg-blue-300 border-blue-500 text-blue-900';
                 else seatBgColor = isVeg ? 'bg-green-500 border-green-700 text-white' : 'bg-blue-500 border-blue-700 text-white';
              } else {
                 seatBgColor = (allowEdit && isDisbanded ? 'bg-gray-100 border-gray-400 border-dashed text-transparent' : 'bg-gray-200 border-gray-300 text-transparent');
              }
              const canDragSeat = allowEdit && isDisbanded && isFilled;
              const dropHoverTarget = allowEdit && isDisbanded ? 'hover:scale-150 hover:z-50 hover:ring-2 hover:ring-orange-500 transition-all cursor-pointer' : '';

              return (
                <div key={i} title={seatInfo ? `${seatInfo.unitName} (${isChild?'小孩':'大人'}${isVeg?'素':'葷'})` : '空位'} draggable={canDragSeat}
                  onDragStart={(e) => canDragSeat && handleSeatDragStart(e, table.id, i)}
                  onDragOver={(e) => { if (allowEdit && isDisbanded) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; } }}
                  onDrop={(e) => { if (allowEdit && isDisbanded) { e.stopPropagation(); handleSeatDrop(e, table.id, i); } }}
                  className={`absolute w-6 h-6 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-bold shadow-sm ${seatBgColor} z-20 ${canDragSeat ? 'cursor-grab active:cursor-grabbing' : ''} ${dropHoverTarget}`}
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                >
                  {seatInfo ? seatInfo.unitName.substring(0, 1) : ''}
                </div>
              );
            })}
            <div className="absolute top-[100px] left-1/2 transform -translate-x-1/2 w-max min-w-[80px] text-[11px] bg-white/90 px-2 py-1.5 rounded shadow-sm border border-gray-200 text-center pointer-events-none z-30 leading-tight">
              {Object.entries(unitCounts).length > 0 ? Object.entries(unitCounts).map(([name, count]) => <div key={name} className="text-gray-700 whitespace-nowrap">{name}: {count}人</div>) : <div className="text-gray-400 whitespace-nowrap">尚未安排</div>}
            </div>
          </div>
        )
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* --- 彈出視窗區 --- */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h2 className="text-xl font-bold mb-4 text-center text-blue-900">管理系統後台登入</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input type="text" placeholder="帳號" value={loginUser} onChange={(e)=>setLoginUser(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" autoFocus />
              <input type="password" placeholder="密碼" value={loginPass} onChange={(e)=>setLoginPass(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">登入</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">更改密碼</h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <input type="password" placeholder="舊密碼" value={oldPass} onChange={(e)=>setOldPass(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" required />
              <input type="password" placeholder="新密碼" value={newPass} onChange={(e)=>setNewPass(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" required />
              <input type="password" placeholder="確認新密碼" value={confirmPass} onChange={(e)=>setConfirmPass(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" required />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">取消</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">儲存修改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
               <h2 className="text-xl font-bold text-gray-800">👥 帳號管理</h2>
               <button onClick={() => setShowAccountModal(false)} className="text-gray-500 hover:text-red-500 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="flex gap-2 mb-4 bg-gray-50 p-3 rounded border">
              <input type="text" placeholder="新帳號名稱" value={newAccUser} onChange={(e)=>setNewAccUser(e.target.value)} className="flex-1 w-0 px-2 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500" required />
              <input type="password" placeholder="設定密碼" value={newAccPass} onChange={(e)=>setNewAccPass(e.target.value)} className="flex-1 w-0 px-2 py-1.5 border rounded text-sm focus:outline-none focus:border-blue-500" required />
              <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium whitespace-nowrap">新增</button>
            </form>
            <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-2">
               {accounts.map(acc => (
                 <div key={acc.username} className="flex justify-between items-center bg-white border p-2 rounded">
                    <div><span className="font-bold text-gray-700">{acc.username}</span>{acc.role === 'super' && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">超級管理員</span>}</div>
                    {acc.role !== 'super' && <button onClick={() => handleDeleteAccount(acc.username)} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-medium">刪除</button>}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* --- 頂部導覽列 --- */}
      <div className="sticky top-0 z-[9999] bg-white border-b shadow-sm print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl lg:text-2xl font-bold text-blue-900">文康活動座位管理系統</h1>
          <div className="flex items-center gap-2">
            {!isAdmin && isPublished && (
              <>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium text-sm shadow-sm transition-colors">🖨️ 列印座位圖</button>
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-medium text-sm shadow-sm transition-colors lg:mr-4">📄 下載電子檔(PDF)</button>
              </>
            )}
            
            {isAdmin ? (
              <>
                <div className="hidden lg:flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mr-2">
                   <span className="text-sm font-bold text-blue-800">👤 {currentUser?.username}</span>
                </div>
                {currentUser?.role === 'super' && !isPreviewMode && (
                   <button onClick={() => setShowAccountModal(true)} className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 font-medium text-sm shadow-sm transition-colors">👥 帳號管理</button>
                )}
                <button onClick={() => setShowPasswordModal(true)} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium text-sm shadow-sm transition-colors mr-1">🔑 更改密碼</button>
                
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-medium text-sm shadow-sm transition-colors mr-1">
                  {isPreviewMode ? '🔙 返回編輯' : '👁️ 預覽前台'}
                </button>
                <button onClick={handleLogout} className="px-4 py-1.5 rounded font-medium whitespace-nowrap transition-colors bg-red-100 text-red-700 hover:bg-red-200 text-sm shadow-sm">
                  🔒 登出
                </button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="px-4 py-1.5 rounded font-medium whitespace-nowrap transition-colors bg-blue-600 text-white hover:bg-blue-700 text-sm shadow-sm">
                ⚙️ 管理系統後台登入
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- 主內容區塊 --- */}
      <div className="max-w-[1920px] mx-auto px-2 lg:px-4 py-4 flex-1 w-full">
        {isAdmin && !isPreviewMode ? (
          // 後台編輯介面
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* 左側設定區 */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 print:hidden">
              <div className="bg-white p-4 rounded shadow-sm border">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={exportData} className="px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-[13px] font-medium">📥 匯出進度</button>
                  <label className="px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-[13px] font-medium cursor-pointer">
                    📤 載入進度
                    <input type="file" accept=".json" onChange={importData} ref={fileInputRef} className="hidden" />
                  </label>
                  <label className="px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-[13px] font-medium cursor-pointer" title="從 Google 試算表下載為 CSV 檔後匯入">
                    📊 匯入報名表CSV
                    <input type="file" accept=".csv" onChange={importCSVData} className="hidden" />
                  </label>
                  <button
                    onClick={() => setIsPublished(!isPublished)}
                    className={`px-2 py-1.5 border rounded text-[13px] font-medium ${isPublished ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`}
                  >
                    {isPublished ? '👀 公開中' : '🙈 座位未公開'}
                  </button>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-2 border-b pb-2">參加單位名單</h2>
                
                {/* 新增單位區塊 */}
                <div className="flex flex-col gap-2 mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                  <input type="text" placeholder="請輸入單位名稱 (例如：教務處)" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="w-full px-2 py-1.5 border rounded focus:outline-none focus:border-blue-500 text-sm mb-1"/>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between bg-white px-2 py-1 border rounded"><span className="text-gray-600">大(葷)</span><input type="number" min="0" value={newUnitAdultMeat} onChange={(e) => setNewUnitAdultMeat(Number(e.target.value))} className="w-12 text-center bg-gray-50 border rounded focus:outline-none"/></div>
                    <div className="flex items-center justify-between bg-white px-2 py-1 border rounded"><span className="text-green-600 font-medium">大(素)</span><input type="number" min="0" value={newUnitAdultVeg} onChange={(e) => setNewUnitAdultVeg(Number(e.target.value))} className="w-12 text-center bg-gray-50 border rounded focus:outline-none"/></div>
                    <div className="flex items-center justify-between bg-white px-2 py-1 border rounded"><span className="text-gray-600">小(葷)</span><input type="number" min="0" value={newUnitChildMeat} onChange={(e) => setNewUnitChildMeat(Number(e.target.value))} className="w-12 text-center bg-gray-50 border rounded focus:outline-none"/></div>
                    <div className="flex items-center justify-between bg-white px-2 py-1 border rounded"><span className="text-green-600 font-medium">小(素)</span><input type="number" min="0" value={newUnitChildVeg} onChange={(e) => setNewUnitChildVeg(Number(e.target.value))} className="w-12 text-center bg-gray-50 border rounded focus:outline-none"/></div>
                  </div>
                  <button onClick={addUnit} className="w-full mt-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">加入名單</button>
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {units.map(unit => (
                    <div key={unit.id} className="p-3 bg-white border shadow-sm rounded-md flex flex-col gap-2">
                      {editingUnitId === unit.id ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input type="text" value={editUnitName} onChange={(e) => setEditUnitName(e.target.value)} className="w-full px-2 py-1.5 border border-blue-400 rounded focus:outline-none text-sm font-bold"/>
                          <div className="grid grid-cols-2 gap-1 text-[13px]">
                             <label className="flex items-center justify-between">大葷 <input type="number" min="0" value={editUnitAdultMeat} onChange={(e)=>setEditUnitAdultMeat(Number(e.target.value))} className="w-10 border rounded px-1"/></label>
                             <label className="flex items-center justify-between">大素 <input type="number" min="0" value={editUnitAdultVeg} onChange={(e)=>setEditUnitAdultVeg(Number(e.target.value))} className="w-10 border rounded px-1"/></label>
                             <label className="flex items-center justify-between">小葷 <input type="number" min="0" value={editUnitChildMeat} onChange={(e)=>setEditUnitChildMeat(Number(e.target.value))} className="w-10 border rounded px-1"/></label>
                             <label className="flex items-center justify-between">小素 <input type="number" min="0" value={editUnitChildVeg} onChange={(e)=>setEditUnitChildVeg(Number(e.target.value))} className="w-10 border rounded px-1"/></label>
                          </div>
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={saveEditUnit} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium">儲存</button>
                            <button onClick={() => setEditingUnitId(null)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs font-medium">取消</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800 text-[15px]">{unit.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => startEditUnit(unit)} className="p-1 hover:bg-gray-100 rounded text-sm">✏️</button>
                              <button onClick={() => deleteUnit(unit.id)} className="p-1 hover:bg-red-50 text-red-500 rounded text-sm">🗑️</button>
                            </div>
                          </div>
                          <div className="text-[12px] text-gray-600 flex flex-wrap gap-x-2 gap-y-1">
                            <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded">總數: {unit.count}</span>
                            {unit.adultMeat > 0 && <span>大葷: {unit.adultMeat}</span>}
                            {unit.adultVeg > 0 && <span className="text-green-600 font-medium">大素: {unit.adultVeg}</span>}
                            {unit.childMeat > 0 && <span>小葷: {unit.childMeat}</span>}
                            {unit.childVeg > 0 && <span className="text-green-600 font-medium">小素: {unit.childVeg}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 待分配人員區塊 */}
                <div 
                   className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-inner flex flex-col"
                   onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                   onDrop={handleUnassignedDrop}
                >
                   <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
                      <span className="font-bold text-blue-900 text-sm">🚶 待分配人員 ({unassignedList.length})</span>
                      <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded">可將已入座者拖回此處</span>
                   </div>
                   <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                      {unassignedList.map((seat, i) => {
                         const isChild = seat.seatType.includes('child');
                         const isVeg = seat.seatType.includes('Veg');
                         const seatBgColor = isChild
                            ? (isVeg ? 'bg-green-300 border-green-500 text-green-900' : 'bg-blue-300 border-blue-500 text-blue-900')
                            : (isVeg ? 'bg-green-500 border-green-700 text-white' : 'bg-blue-500 border-blue-700 text-white');

                         return (
                           <div
                             key={i}
                             title={`${seat.unitName} (${isChild?'小孩':'大人'}${isVeg?'素':'葷'})`}
                             draggable
                             onDragStart={(e) => handleUnassignedDragStart(e, seat)}
                             className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shadow-sm ${seatBgColor} cursor-grab active:cursor-grabbing hover:scale-125 transition-transform`}
                           >
                             {seat.unitName.substring(0, 1)}
                           </div>
                         );
                      })}
                      {unassignedList.length === 0 && <span className="text-xs text-gray-400 py-2 w-full text-center">目前所有人皆已入座</span>}
                   </div>
                </div>

              </div>
            </div>

            {/* 右側場地繪圖與控制區 */}
            <div className="w-full flex-1 flex flex-col gap-2">
              <div className="bg-white p-3 rounded shadow-sm border flex flex-wrap items-center gap-2 print:hidden">
                <div className="flex items-center gap-1 border-r pr-2 border-gray-300">
                  <span className="text-xs font-bold text-gray-700">新增物件：</span>
                  <button onClick={() => addTable('normal')} className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 text-xs font-medium">+ 一般桌</button>
                  <button onClick={() => addTable('child')} className="px-2 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded hover:bg-pink-100 text-xs font-medium">+ 小孩桌</button>
                  <button onClick={() => addDrawing('stage')} className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 text-xs font-medium ml-1">+ 舞台(方)</button>
                  <button onClick={() => addDrawing('pillar')} className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 text-xs font-medium">+ 柱/門</button>
                  <button onClick={() => addDrawing('text')} className="px-2 py-1 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-xs font-medium">+ 文字標籤</button>
                </div>
                
                <div className="flex items-center gap-1 border-r pr-2 border-gray-300">
                   <button onClick={autoAssign} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium shadow-sm">✨ 自動排位</button>
                   <button onClick={clearSeatsOnly} className="px-2 py-1 bg-gray-100 text-yellow-600 border border-yellow-200 rounded hover:bg-yellow-50 text-xs font-medium">🧹 離座</button>
                   <button onClick={clearTables} className="px-2 py-1 bg-gray-100 text-red-600 border border-gray-200 rounded hover:bg-red-50 text-xs font-medium">🗑️ 清空</button>
                </div>

                <div className="flex items-center gap-1">
                   <span className="text-xs font-bold text-gray-700 ml-1">縮放：</span>
                   <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">-</button>
                   <span className="text-xs w-10 text-center font-medium">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 font-bold">+</button>
                </div>
              </div>

              {/* 帶有捲軸的縮放畫布容器 */}
              <div className="flex-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded shadow-inner min-h-[750px] overflow-auto print:border-none print:bg-white print:overflow-visible print:min-h-0 custom-scrollbar">
                <div style={{ width: `${3000 * zoom}px`, height: `${2000 * zoom}px` }} className="relative print:w-auto print:h-auto">
                  <div
                    className="absolute top-0 left-0 bg-white shadow-sm border border-gray-200 print:shadow-none print:border-none"
                    style={{ width: '3000px', height: '2000px', transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    onDragOver={handleDragOver} onDrop={handleDrop}
                  >
                     <div className="absolute inset-0 pointer-events-none opacity-20 print:hidden" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                     {renderCanvasContent(true)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // --- 前台公開檢視與預覽模式 ---
          <div className="bg-white p-4 lg:p-8 rounded shadow border text-center min-h-[500px] flex flex-col items-center relative print:p-0 print:border-none print:shadow-none print:block">
             {isAdmin && isPreviewMode && !isPublished && (
               <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm font-bold shadow-sm border border-yellow-300 z-50 flex items-center gap-2 print:hidden">
                 <span>⚠️</span><span>目前為「座位未公開」狀態，一般訪客將無法看到此畫面，此為管理員專屬預覽。</span>
               </div>
             )}

             {!isPublished && !isAdmin ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 mt-20">
                  <span className="text-6xl">🔒</span>
                  <h2 className="text-2xl font-bold text-gray-700">安排中，座位未公開。</h2>
                </div>
             ) : (
                <div className={`w-full flex flex-col items-center ${isAdmin && isPreviewMode && !isPublished ? 'mt-10' : ''} print:mt-0 print:block`}>
                   
                   {/* 前台控制列與圖例 */}
                   <div className="flex flex-wrap justify-between items-end w-full mb-4 print:hidden">
                      <div className="flex gap-4 text-sm font-medium text-gray-600">
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700 inline-block"></span>大人(葷)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 border border-green-700 inline-block"></span>大人(素)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-300 border border-blue-500 inline-block"></span>小孩(葷)</div>
                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-300 border border-green-500 inline-block"></span>小孩(素)</div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border">
                         <span className="text-sm font-bold text-gray-700">地圖縮放：</span>
                         <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 flex items-center justify-center bg-white border shadow-sm rounded-full hover:bg-gray-100 font-bold text-lg">-</button>
                         <span className="text-sm w-12 text-center font-bold text-blue-700">{Math.round(zoom * 100)}%</span>
                         <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 flex items-center justify-center bg-white border shadow-sm rounded-full hover:bg-gray-100 font-bold text-lg">+</button>
                      </div>
                   </div>

                   {/* 前台預覽畫布 */}
                   <div className="w-full bg-gray-100 border-2 border-gray-300 rounded overflow-auto h-[800px] shadow-inner print:border-none print:bg-white print:overflow-visible print:h-auto print:block custom-scrollbar">
                     <div style={{ width: `${3000 * zoom}px`, height: `${2000 * zoom}px` }} className="relative mx-auto print:w-full print:h-auto print:block">
                        <div className="absolute top-0 left-0 bg-white print:relative print:w-full" style={{ width: '3000px', height: '2000px', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                           {renderCanvasContent(false)}
                        </div>
                     </div>
                   </div>
                   <p className="mt-4 text-gray-500 text-sm print:hidden">💡 提示：您可以使用上方按鈕縮放地圖，或使用滑鼠拖曳捲軸來查看全場座位。</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* 灰階版權小字放置於最底部 */}
      <FooterCopyright />

      {/* 強制排版與客製化捲軸樣式 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @media print {
          @page { size: landscape; margin: 1cm; }
          body { background: white !important; margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .print\\:w-auto { width: auto !important; }
          .print\\:h-auto { height: auto !important; }
          .print\\:block { display: block !important; position: static !important; }
          div[style*="width: 3000px"] { transform: scale(0.35) !important; transform-origin: top left !important; }
        }
      `}} />
    </div>
  );
}