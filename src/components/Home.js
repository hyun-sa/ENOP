import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import Select from "react-select";
import "../App.css";

const collections = {
  Compression: ["7zr_b"],
  Database: ["ycsb_a", "ycsb_b", "ycsb_c", "ycsb_d", "ycsb_e", "ycsb_f"],
};

const databases = [
  { label: "ftrace_data", value: "ftrace_data" },
  { label: "perf_data", value: "perf_data" },
];

const allOptions = [
  { label: "7zr_b", value: "7zr_b", tag1: "Compression" },
  { label: "ycsb_a", value: "ycsb_a", tag1: "Database" },
  { label: "ycsb_b", value: "ycsb_b", tag1: "Database" },
  { label: "ycsb_c", value: "ycsb_c", tag1: "Database" },
  { label: "ycsb_d", value: "ycsb_d", tag1: "Database" },
  { label: "ycsb_e", value: "ycsb_e", tag1: "Database" },
  { label: "ycsb_f", value: "ycsb_f", tag1: "Database" },
];

function Home() {
  const [selectedTag1, setSelectedTag1] = useState("Compression");
  const [selectedTag2, setSelectedTag2] = useState("7zr_b");
  const [selectedDatabase, setSelectedDatabase] = useState("ftrace_data");
  const [selectedType, setSelectedType] = useState("scattergl");
  const [useRAxis, setUseRAxis] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState(null);
  const [page, setPage] = useState(1);

  // 각 데이터베이스에 따른 pageSize 설정
  const pageSize = selectedDatabase === "perf_data" ? 2000 : 10000;

  useEffect(() => {
    console.log(
      `Fetching data for db: ${selectedDatabase}, collection: ${selectedTag2}, page: ${page}, useRAxis: ${useRAxis}`
    );
    fetch(
      `http://localhost:4000/data?db=${selectedDatabase}&collection=${selectedTag2}&page=${page}&pageSize=${pageSize}&useRAxis=${useRAxis}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(({ data, total }) => {
        if (Array.isArray(data)) {
          console.log("Fetched data:", data);
          setData(data);
          setTotal(total);
        } else {
          console.error("Fetched data is not an array:", data);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [selectedDatabase, selectedTag2, page, useRAxis]);

  useEffect(() => {
    // perf_data를 선택할 때 기본 그래프 유형을 bar로 설정
    if (selectedDatabase === "perf_data") {
      setSelectedType("bar");
    }
  }, [selectedDatabase]);

  const plotData = useMemo(() => {
    if (selectedDatabase === "ftrace_data") {
      return {
        x: data.map((d) => parseFloat(d.timestamp)),
        y: data.map((d) => d.page),
        type: selectedType,
        mode: selectedType === "scattergl" ? "markers" : undefined,
        marker: { color: "blue" },
      };
    } else if (selectedDatabase === "perf_data") {
      return {
        x: data.map((d) => d.symbol),
        y: data.map((d) => parseFloat(d.percentage)),
        type: selectedType,
        mode: selectedType === "scattergl" ? "markers" : undefined,
        marker: { color: "blue" },
      };
    }
    return {};
  }, [data, selectedDatabase, selectedType]);

  const handleTag1Change = (e) => {
    const tag1 = e.target.value;
    setSelectedTag1(tag1);
    setSelectedTag2(collections[tag1][0]);
    setPage(1); // Tag1 변경 시 페이지를 초기화
  };

  const handleSearchChange = (selectedOption) => {
    setSearchValue(selectedOption);
  };

  const handleSearchClick = () => {
    if (searchValue) {
      setSelectedTag1(searchValue.tag1);
      setSelectedTag2(searchValue.value);
      setPage(1); // 검색 시 페이지를 초기화
    }
  };

  const handleDatabaseChange = (e) => {
    setSelectedDatabase(e.target.value);
    setPage(1); // Database 변경 시 페이지를 초기화
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minWidth: "200px",
      marginRight: "8px",
    }),
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col font-serif">
      <main className="container mx-auto flex-1 px-4">
        <div className="bg-white shadow-md px-6 rounded-md pb-4">
          <div className="flex items-center mb-4">
            <div className="relative w-full">
              <div className="flex mt-4">
                <Select
                  options={allOptions}
                  onChange={handleSearchChange}
                  placeholder="Search bar"
                  styles={customStyles}
                  value={searchValue}
                />
                <button
                  className="border border-gray-500 bg-gray-300 px-3 rounded-md"
                  onClick={handleSearchClick}
                >
                  Search
                </button>
              </div>
              <div className="flex mt-4">
                <select
                  className="bg-white border border-gray-300 px-2 py-2 rounded-md pr-8 mr-2"
                  value={selectedTag1}
                  onChange={handleTag1Change}
                >
                  <option value="Compression">Compression</option>
                  <option value="Database">Database</option>
                </select>
                <select
                  className="bg-white border border-gray-300 px-2 py-2 rounded-md pr-8 mr-2"
                  value={selectedTag2}
                  onChange={(e) => {
                    setSelectedTag2(e.target.value);
                    setPage(1); // Tag2 변경 시 페이지를 초기화
                  }}
                >
                  {collections[selectedTag1].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="border border-gray-400 p-3 rounded-sm shadow-sm flex justify-center flex-col items-center">
            <div className="mb-4">
              <span className="font-bold">WORKLOAD NAME </span>
              <span className="text-gray-500">
                [{selectedTag1}] [{selectedTag2}]
              </span>
            </div>
            <div className="bg-gray-200 p-4 rounded-md">
              <Plot
                data={[plotData]}
                layout={{
                  title: `Data over Time (Page ${page} of ${totalPages})`,
                  xaxis: {
                    title:
                      selectedDatabase === "ftrace_data"
                        ? "Time (s)"
                        : "Symbol",
                    showticklabels: selectedDatabase !== "perf_data", // perf_data일 때 x축 레이블 숨김
                  },
                  yaxis: {
                    title:
                      selectedDatabase === "ftrace_data"
                        ? "Page"
                        : "Percentage",
                    showticklabels: selectedDatabase !== "ftrace_data", // ftrace_data일 때 y축 레이블 숨김
                  },
                }}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="flex my-4">
              <select
                className="bg-white border border-gray-300 px-2 py-2 rounded-md pr-8 mr-2"
                value={selectedDatabase}
                onChange={handleDatabaseChange}
              >
                {databases.map((db) => (
                  <option key={db.value} value={db.value}>
                    {db.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <select
                  className="bg-white border border-gray-300 px-3 py-2 rounded-md pr-8 mr-2"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="scattergl">Scatter</option>
                  <option value="bar">Bar</option>
                </select>
              </div>
              <div className="relative flex items-center">
                <label className="text-gray-700 mr-2">Absolute</label>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={useRAxis}
                  onChange={(e) => setUseRAxis(e.target.checked)}
                />
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="border border-gray-500 bg-gray-300 px-3 py-2 rounded-md mr-2"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                className="border border-gray-500 bg-gray-300 px-3 py-2 rounded-md ml-2"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
