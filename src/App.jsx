import { useRef, useEffect, useState } from "react";
import "./App.css";
import {
  Play,
  Pause,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ChevronsDown,
  SkipBack,
  SkipForward,
  CircleAlert,
  EllipsisVertical,
  X,
} from "lucide-react";

function App() {
  const [voices, setVoices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState([]);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1.35);
  const [start, setStart] = useState(false);
  const [selection, setSelection] = useState([]);
  const [currentSelectionIndex, setCurrentSelectionIndex] = useState(-1);
  const [convert, setConvert] = useState(null);
  const [isSpellcheck, setIsSpellcheck] = useState(false);
  const [noteIsOpen, setNoteIsOpen] = useState(false);
  const [detailIsOpen, setDetailIsOpen] = useState(false);
  const [utterance, setUtterance] = useState(null); // ไม่ต้องระบุประเภทข้อมูลใน JavaScript
  const voiceRef = useRef(null);
  const rateRef = useRef(1);
  const volumeRef = useRef(1);

  // หยุดเสียงที่กำลังพูดอยู่ทันทีที่รีเฟรชหน้าเว็บ
  useEffect(() => {
    const stopSpeakingOnRefresh = () => {
      window.speechSynthesis.cancel();
    };
  
    window.addEventListener('beforeunload', stopSpeakingOnRefresh);
  
    return () => {
      window.removeEventListener('beforeunload', stopSpeakingOnRefresh);
    };
  }, []);

  useEffect(() => {
    voiceRef.current = voice;
    rateRef.current = rate;
    volumeRef.current = volume;
  }, [voice, rate, volume]);
  
  const togglePlay = () => {
    if (speaking) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
    }
    setSpeaking(!speaking);
  };
  
  const speak = () => {
    window.speechSynthesis.cancel();
    const newUtterance = new SpeechSynthesisUtterance();

    if (!convert?.length && !selection.length) {
      console.warn("ไม่มีข้อความให้อ่าน");
      return;
    }
    
    if (selection.length > 0) {
      const sortedSelection = [...selection].sort((a, b) => a.index - b.index);
      const selectedText = sortedSelection
      .map((item) => item.text)
      .join(" ");
      newUtterance.text = formatText(selectedText);
    } else if (Array.isArray(convert) && convert.length > 0) {
      const readText = convert.join(" ");
      newUtterance.text = formatText(readText);
    }
    
    newUtterance.voice = voiceRef.current;
    newUtterance.lang = "th-TH";
    newUtterance.rate = rateRef.current;
    newUtterance.volume = volumeRef.current;

    newUtterance.onstart = () => {
      setSpeaking(true);
      setStart(true);
    };

    newUtterance.onend = () => {
      setSpeaking(false);
      setStart(false);
      setUtterance(null); // เคลียร์ออกจาก state
    };
    
    setUtterance(newUtterance); // เซฟใหม่ (หากต้องใช้ภายหลัง)
    window.speechSynthesis.speak(newUtterance);
  };

  const cancel = () => {
    window.speechSynthesis.cancel();
    setStart(false);
    setSpeaking(false);
    setUtterance(null);
  };

  const changeVoice = (param) => {
    setVoice(param)
    utterance && (utterance.voice = param);
  };

  const changeVolume = (param) => {
    setVolume(param === "+" ? volume + 0.05 : volume - 0.05);
  };

  const changeRate = (param) => {
    setRate(param === "+" ? rate + 0.05 : rate - 0.05);
  };

  const pause = () => {
    window.speechSynthesis.pause();
  };

  const resume = () => {
    window.speechSynthesis.resume();
  };

  const formatText = (text) => {
    const words = text.split(" ");
    let outputText = "";

    words.forEach((word) => {
      outputText += word;
      if (word.length > 20 || word.endsWith(".")) {
        outputText += "\n";
      } else {
        outputText += " ";
      }
    });

    return outputText;
  };
  
  const convertText = (text) => {
    const paragraphs = text.split(/\r?\n/);
    setConvert(paragraphs);
  };
  
  const handleChange = (event) => {
    setText(event.target.value);
    convertText(event.target.value);
  };

  // ฟังก์ชันจัดการการเลือก <p> เมื่อคลิก
  const handleClick = (index, e) => {
    cancel();
    setCurrentSelectionIndex(index);
    const selected = window.getSelection().toString().trim(); // ดึงข้อความที่ถูกเลือก (trim เพื่อลบช่องว่าง)
    const newSelection = [...selection];
    console.log(selected)
    const selectedText = selected || convert[index]; // ถ้ามีข้อความที่เลือก ให้ใช้ข้อความนั้น ถ้าไม่มีก็ใช้ทั้งพารากราฟ
    console.log(selectedText)

    const existingIndex = newSelection.findIndex(
      (item) => item.index === index
    );

    if (existingIndex !== -1) {
      // ถ้าคลิกที่พารากราฟเดิมซ้ำ ให้ลบออก
      newSelection.splice(existingIndex, 1);
      if (selected) {
        newSelection.length = 0;
        newSelection.push({ index, text: selectedText });
      }
    } else {
      if (e.ctrlKey || e.metaKey) {
        // กด Ctrl/Command ค้างไว้เพื่อเลือกหลายอัน
        newSelection.push({ index, text: selectedText });
      } else {
        // เลือกใหม่ทั้งหมด
        newSelection.length = 0;
        newSelection.push({ index, text: selectedText });
      }
    }

    setSelection(newSelection); // อัปเดต state
  };

  //ฟังก์ชันเลื่อนไป selection ถัดไป
  const nextSelection = (e) => {
    // setCurrentSelectionIndex(currentSelectionIndex ? currentSelectionIndex : -1);
    if (convert.length > 0) {
      const nextIndex = (currentSelectionIndex + 1) % convert.length;
      setCurrentSelectionIndex(nextIndex);
      handleClick(nextIndex, e);

      // ค้นหา <p> ที่มี data-index ตรงกับ selection[nextIndex].index
      const selector = `.convert p[data-index="${nextIndex}"]`;

      const selectedElement = document.querySelector(selector);

      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        console.warn("ไม่พบ element สำหรับ data-index:", nextIndex);
      }
    }
  };

  //ฟังก์ชันเลื่อนไป selection ถัดไป
  const prevSelection = (e) => {
    if (convert.length > 0) {
      const prevIndex =
        (currentSelectionIndex - 1 + convert.length) % convert.length;
      handleClick(prevIndex, e);
      setCurrentSelectionIndex(prevIndex);

      // ค้นหา <p> ที่มี data-index ตรงกับ selection[nextIndex].index
      const selector = `.convert p[data-index="${prevIndex}"]`;

      const selectedElement = document.querySelector(selector);

      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        console.warn("ไม่พบ element สำหรับ data-index:", prevIndex);
      }
    }
  };


  useEffect(() => {
    // โหลดเสียงเมื่อ voices เปลี่ยนแปลง
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);

        // หามีเสียงที่ชื่อรวมคำว่า "Premwadee" หรือไม่
        const defaultVoice = availableVoices.find((voice) =>
          voice.name.includes("Premwadee")
        );

        if (!voice || voice.length === 0) {
          setVoice(defaultVoice); // ตั้งค่าเสียงเริ่มต้น
        }

        setLoaded(true); // เสียงโหลดเสร็จแล้ว
      }
    };

    loadVoices(); // ลองโหลดทันที

    // ถ้ายังไม่โหลด ให้รอฟังก์ชัน voiceschanged
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
    };

    // ทำความสะอาดเมื่อคอมโพเนนต์ unmount
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voice]);

  return (
    <>
      <h1>EdgeTTS Voice</h1>
      <select
        aria-label="Select Voise"
        value={voice?.name || ""}
        onChange={(e) => {
          const selectedVoice = voices.find(
            (voice) => voice.name === e.target.value
          );
          changeVoice(selectedVoice);
        }}
      >
        {voices
          .sort((a) => (a.name === voice?.name ? -1 : 1))
          .map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name}
            </option>
          ))}
      </select>
      <div className="content">
        <div className="input">
          <textarea
            id="textarea"
            value={text}
            onInput={(e) => setIsSpellcheck(!e.target.value == "")}
            onChange={(e) => handleChange(e)}
            rows="4"
            cols="50"
            placeholder="พิมพ์ข้อความที่นี่..."
          />
        </div>
        <div className="convert">
          {isSpellcheck
            ? convert.map((paragraph, index) => {
                return (
                  <p
                    className={
                      selection.some((item) => item.index === index)
                        ? "selected"
                        : ""
                    }
                    onClick={(e) => handleClick(index, e)}
                    key={index}
                    data-index={index}
                  >
                    {paragraph}
                  </p>
                );
              })
            : "รอ..."}
        </div>
      </div>

      <div className="player">
        <button className="p-2" onClick={cancel} title="เคลียร์">
          Clear
        </button>
        <button
          className="p-2"
          onClick={(e) => prevSelection(e)}
          title="ก่อนหน้า"
        >
          {<SkipBack size={18} />}
        </button>
        <button className="p-2" onClick={togglePlay} title="เล่น/หยุด">
          {speaking && text && loaded ? (
            <Pause onClick={pause} size={28} />
          ) : start ? (
            <Play onClick={resume} size={28} />
          ) : (
            <Play onClick={speak} size={28} />
          )}
        </button>
        <button className="p-2" onClick={(e) => nextSelection(e)} title="ถัดไป">
          {<SkipForward size={18} />}
        </button>
        <button
          className="p-2"
          onClick={() => changeRate("-")}
          title="เพิ่มความเร็ว"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          className="p-2"
          onClick={() => changeRate("+")}
          title="ลดความเร็ว"
        >
          <ChevronsRight size={18} />
        </button>
        <button
          className="p-2"
          onClick={() => changeVolume("+")}
          title="เพิ่มเสียง"
        >
          <ChevronsUp size={18} />
        </button>
        <button
          className="p-2"
          onClick={() => changeVolume("-")}
          title="ลดเสียง"
        >
          <ChevronsDown size={18} />
        </button>
        <button
          className="p-2"
          onClick={() => setDetailIsOpen(true)}
          title="รายละเอียด"
        >
          <EllipsisVertical size={18} />
        </button>
        <button
          className="p-2"
          onClick={() => setNoteIsOpen(true)}
          title="อ่านหน่อย"
        >
          <CircleAlert size={18} />
        </button>
      </div>

      <div>
        {noteIsOpen && (
          <div className="modal-overlay" onClick={() => setNoteIsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>คำอธิบาย</h2>
              <ul>
                <li>ถ้ากดเล่นแล้วไม่มีเสียงให้กดใหม่</li>
                <li>
                  ถ้ากดเล่นแล้วยังไม่จบ แล้วอยากจะเริ่มอ่านใหม่ ให้กด clear
                </li>
                <li>ถ้าอยากอ่านทีละพารากราฟ ให้กดที่พารากราฟนั้น</li>
                <li>ปุ่มก่อนหน้า และ ปุ่มถัดไป คือการเลือกพารากราฟ</li>
              </ul>
              <button onClick={() => setNoteIsOpen(false)} title="ปิด">
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        {detailIsOpen && (
          <div className="modal-overlay" onClick={() => setDetailIsOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>รายละเอียด</h2>
              <ul>
                <li>Status (สถานะ) : {speaking ? "กำลังเล่น" : "หยุดเล่น"}</li>
                <li>Queue (คิว) : {start ? "อยู่ในคิว" : "คิวว่าง"}</li>
                <li>Rate (ความเร็ว) : {rate.toFixed(2)}</li>
                <li>Volume (ระดับเสียง) : {volume.toFixed(2)}</li>
              </ul>
              <button onClick={() => setDetailIsOpen(false)} title="ปิด">
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
