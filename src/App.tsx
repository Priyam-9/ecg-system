/* eslint-disable @typescript-eslint/no-unused-vars */
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <button
    className={`rounded px-4 py-2 font-semibold shadow ${className}`}
    {...props}
  >
    {children}
  </button>
);
import type React from "react";
import { useCallback, useRef, useState } from "react";

interface Connection {
  from: string;
  to: string;
}

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startPoint: string | null;
  currentPos: Position;
}

const App = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPoint: null,
    currentPos: { x: 0, y: 0 },
  });
  const [ecgData, setEcgData] = useState<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Electrode positions on the body
  const electrodePositions = {
    RA: { x: 340, y: 250 }, // Right Arm
    LA: { x: 170, y: 250 }, // Left Arm
    RL: { x: 230, y: 450 }, // Right Leg
  };

  // Amplifier connection points
  const amplifierPoints = {
    LA: { x: 405, y: 265 }, // Positive input
    RA: { x: 405, y: 340 }, // Negative input
    RL: { x: 500, y: 410 }, // Ground
  };

  // Generate ECG waveform data
  const generateECGData = useCallback(() => {
    const data: number[] = [];
    const length = 200;
    const baselineNoise = () => (Math.random() - 0.5) * 0.1;

    for (let i = 0; i < length; i++) {
      // const t = (i / length) * 4 * Math.PI;
      let value = 0;

      // P wave
      if (i % 50 === 10)
        value += 0.3 * Math.exp(-Math.pow(((i % 50) - 10) / 3, 2));

      // QRS complex
      if (i % 50 === 25) {
        value += -0.2; // Q wave
      } else if (i % 50 === 27) {
        value += 1.5; // R wave
      } else if (i % 50 === 29) {
        value += -0.4; // S wave
      }

      // T wave
      if (i % 50 === 40)
        value += 0.4 * Math.exp(-Math.pow(((i % 50) - 40) / 4, 2));

      data.push(value + baselineNoise());
    }
    return data;
  }, []);

  // Check if connections are correct for Lead I
  const checkConnections = () => {
    const correctConnections = [
      { from: "RA", to: "RA" },
      { from: "LA", to: "LA" },
      { from: "RL", to: "RL" },
    ];

    const isCorrect =
      correctConnections.every((correct) =>
        connections.some(
          (conn) => conn.from === correct.from && conn.to === correct.to
        )
      ) && connections.length === 3;

    if (isCorrect) {
      alert(
        "Correct Configuration! Lead I is properly connected.\nLA (Left Arm) → Positive\nRA (Right Arm) → Negative\nRL (Right Leg) → Ground"
      );
      setEcgData(generateECGData());
    } else {
      alert(
        "Incorrect Configuration! Please check your connections.\nLead I requires:\n- LA to positive input\n- RA to negative input\n- RL to ground"
      );
    }
  };

  // Reset all connections
  const resetConnections = () => {
    setConnections([]);
    setEcgData([]);
    setDragState({
      isDragging: false,
      startPoint: null,
      currentPos: { x: 0, y: 0 },
    });
  };

  // Handle mouse events for dragging
  const handleMouseDown = (point: string, event: React.MouseEvent) => {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setDragState({
        isDragging: true,
        startPoint: point,
        currentPos: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (dragState.isDragging && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDragState((prev) => ({
        ...prev,
        currentPos: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      }));
    }
  };

  const handleMouseUp = (targetPoint: string) => {
    if (dragState.isDragging && dragState.startPoint) {
      // Only allow correct connections
      const validConnections: { [key: string]: string } = {
        RA: "RA",
        LA: "LA",
        RL: "RL",
      };

      if (validConnections[dragState.startPoint] === targetPoint) {
        // Remove existing connection from the same start point
        const newConnections = connections.filter(
          (conn) => conn.from !== dragState.startPoint
        );
        newConnections.push({
          from: dragState.startPoint,
          to: targetPoint,
        });
        setConnections(newConnections);
      }
    }

    setDragState({
      isDragging: false,
      startPoint: null,
      currentPos: { x: 0, y: 0 },
    });
  };

  // Render ECG waveform
  const renderECGWaveform = () => {
    if (ecgData.length === 0) return null;

    const width = 550;
    const height = 200;
    const scaleX = width / ecgData.length;
    const scaleY = height / 4;

    const pathData = ecgData
      .map((value, index) => {
        const x = index * scaleX;
        const y = height / 2 - value * scaleY;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    return <path d={pathData} stroke="#22c55e" strokeWidth="2" fill="none" />;
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4">
      <div className="bg-white border-4 border-black h-full relative">
        {/* Instructions Button */}
        <Button className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">
          INSTRUCTIONS
        </Button>

        {/* Main SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={() =>
            setDragState((prev) => ({
              ...prev,
              isDragging: false,
              startPoint: null,
            }))
          }
        >
          {/* Human Body Figure */}
          <image
            href="/placeholder.svg?height=400&width=200"
            x="150"
            y="80"
            width="200"
            height="400"
            opacity="0.7"
          />

          {/* Body Electrodes */}
          {Object.entries(electrodePositions).map(([label, pos]) => (
            <g key={label}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill="black"
                className="cursor-pointer hover:fill-gray-700"
                onMouseDown={(e) => handleMouseDown(label, e)}
              />
              <text
                x={pos.x}
                y={label === "RL" ? pos.y + 25 : pos.y - 15}
                textAnchor="middle"
                className="text-blue-600 font-bold text-sm pointer-events-none"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Amplifier Circuit */}
          <g transform="translate(450, 250)">
            {/* Amplifier Triangle */}
            <path
              d="M 0 0 L 100 50 L 0 100 Z"
              fill="none"
              stroke="black"
              strokeWidth="3"
            />

            {/* Plus and Minus Signs */}
            <text x="15" y="25" className="text-lg font-bold">
              +
            </text>
            <text x="15" y="85" className="text-lg font-bold">
              -
            </text>

            {/* Connection Points */}
            {Object.entries(amplifierPoints).map(([label, pos]) => (
              <g key={`amp-${label}`}>
                <circle
                  cx={pos.x - 450}
                  cy={pos.y - 250}
                  r="8"
                  fill="black"
                  className="cursor-pointer hover:fill-gray-700"
                  onMouseUp={() => handleMouseUp(label)}
                />
                <text
                  x={pos.x - 450 + 15}
                  y={pos.y - 250 + 5}
                  className="text-blue-600 font-bold text-sm"
                >
                  {label}
                </text>
              </g>
            ))}

            {/* Ground Symbol */}
            <g transform="translate(50, 168)">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="black"
                strokeWidth="2"
              />
              <line
                x1="-8"
                y1="10"
                x2="8"
                y2="10"
                stroke="black"
                strokeWidth="2"
              />
              <line
                x1="-5"
                y1="13"
                x2="5"
                y2="13"
                stroke="black"
                strokeWidth="2"
              />
              <line
                x1="-2"
                y1="16"
                x2="2"
                y2="16"
                stroke="black"
                strokeWidth="2"
              />
            </g>
          </g>

          {/* Connection Lines */}
          {connections.map((conn, index) => {
            const startPos =
              electrodePositions[conn.from as keyof typeof electrodePositions];
            const endPos =
              amplifierPoints[conn.to as keyof typeof amplifierPoints];
            const color =
              conn.from === "LA"
                ? "#ef4444"
                : conn.from === "RA"
                ? "#22c55e"
                : "#000000";

            return (
              <line
                key={index}
                x1={startPos.x}
                y1={startPos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke={color}
                strokeWidth="3"
                className="pointer-events-none"
              />
            );
          })}

          {/* Dragging Line */}
          {dragState.isDragging && dragState.startPoint && (
            <line
              x1={
                electrodePositions[
                  dragState.startPoint as keyof typeof electrodePositions
                ].x
              }
              y1={
                electrodePositions[
                  dragState.startPoint as keyof typeof electrodePositions
                ].y
              }
              x2={dragState.currentPos.x}
              y2={dragState.currentPos.y}
              stroke="#666"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
          )}

          {/* ECG Graph Area */}
          <rect
            x="690"
            y="210"
            width="550"
            height="200"
            fill="#f0f8f0"
            stroke="black"
            strokeWidth="2"
          />

          {/* Grid Lines */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#ccc"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect x="690" y="210" width="550" height="200" fill="url(#grid)" />

          {/* ECG Waveform */}
          <g transform="translate(690, 210)">{renderECGWaveform()}</g>

          {/* Graph Labels */}
          <text x="1270" y="235" className="text-xs text-blue-600">
            10.00
          </text>
          <text x="1270" y="260" className="text-xs text-blue-600">
            5.00
          </text>
          <text x="1270" y="310" className="text-xs text-blue-600">
            0.00
          </text>
          <text x="1270" y="360" className="text-xs text-blue-600">
            -5.00
          </text>
          <text x="1270" y="385" className="text-xs text-blue-600">
            -10.00
          </text>

          <text x="710" y="430" className="text-xs">
            12.00
          </text>
          <text x="810" y="430" className="text-xs">
            14.00
          </text>
          <text x="910" y="430" className="text-xs">
            16.00
          </text>
          <text x="1010" y="430" className="text-xs">
            18.00
          </text>
          <text x="950" y="445" className="text-xs">
            seconds
          </text>
        </svg>

        {/* Control Buttons */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            onClick={checkConnections}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
          >
            CHECK
          </Button>
          <Button
            onClick={resetConnections}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
          >
            RESET
          </Button>
          <Button
            onClick={() => setEcgData(generateECGData())}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
          >
            WAVEFORM
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2">
            PRINT
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;
