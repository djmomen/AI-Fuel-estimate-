
import React, { useState, useMemo, useCallback } from 'react';
import type { SelectedItem, Round, Equipment, LogEntry } from './types';
import { calculateFuelConsumption, normalizeImportedDataWithAI, getAiInsights } from './services/geminiService';
import { exportToXlsx, exportToHtml } from './utils/reportGenerator';
import Header from './components/Header';
import EquipmentGrid from './components/EquipmentGrid';
import SelectionPanel from './components/SelectionPanel';
import RoundsPanel from './components/RoundsPanel';
import LogPanel from './components/LogPanel';
import DashboardPanel from './components/DashboardPanel';

// @ts-ignore
const XLSX = window.XLSX;

export default function App() {
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [period, setPeriod] = useState({ from: '', to: '' });
    const [roundName, setRoundName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<any[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'selection' | 'rounds' | 'log' | 'dashboard'>('selection');
    const [aiJustification, setAiJustification] = useState<string | null>(null);
    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);

    const addLog = useCallback((level: LogEntry['level'], message: string) => {
        const newLog: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            level,
            message,
        };
        setLogs(prevLogs => [...prevLogs, newLog]);
    }, []);

    React.useEffect(() => {
        const isCalculationInvalidated = selectedItems.some(item => item.fuel === undefined);
        if (isCalculationInvalidated) {
            if (sources.length > 0) setSources([]);
            if (aiJustification) setAiJustification(null);
        }
    }, [selectedItems, sources.length, aiJustification]);
    
    // Invalidate insights if rounds change
    React.useEffect(() => {
        setAiInsights(null);
    }, [rounds]);

    const handleAddItem = useCallback((equipment: Equipment) => {
        setSelectedItems(prevItems => {
            const existingItem = prevItems.find(item => item.name === equipment.name);
            if (existingItem) {
                addLog('INFO', `Incremented quantity of ${equipment.name}.`);
                return prevItems.map(item =>
                    item.name === equipment.name ? { ...item, quantity: item.quantity + 1, fuel: undefined, rate: undefined, idleRate: undefined } : item
                );
            }
            addLog('INFO', `Added ${equipment.name} to selection.`);
            return [...prevItems, { ...equipment, id: Date.now().toString(), quantity: 1, hours: 8, idleHours: 0, fuel: undefined }];
        });
    }, [addLog]);

    const handleUpdateItem = useCallback((id: string, field: 'quantity' | 'hours' | 'idleHours', value: number) => {
        setSelectedItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const newValue = Math.max(0, value);
                    if(item[field] !== newValue) {
                        addLog('INFO', `Updated ${item.name}: ${field} set to ${newValue}.`);
                    }
                    return { ...item, [field]: newValue, fuel: undefined, rate: undefined, idleRate: undefined };
                }
                return item;
            })
        );
    }, [addLog]);

    const handleRemoveItem = useCallback((id: string) => {
        const itemToRemove = selectedItems.find(item => item.id === id);
        if (itemToRemove) {
             addLog('INFO', `Removed ${itemToRemove.name} from selection.`);
        }
        setSelectedItems(prevItems => prevItems.filter(item => item.id !== id));
    }, [selectedItems, addLog]);

    const handleClearSelection = useCallback(() => {
        setSelectedItems([]);
        setPeriod({ from: '', to: '' });
        setRoundName('');
        setError(null);
        setSources([]);
        setAiJustification(null);
        addLog('INFO', 'Selection cleared.');
    }, [addLog]);

     const handleClearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const handleCalculate = async () => {
        if (selectedItems.length === 0 || !period.from || !period.to) {
            const msg = "Please select equipment and set a valid period.";
            setError(msg);
            addLog('ERROR', msg);
            return;
        }
        setError(null);
        setIsLoading(true);
        setSources([]);
        setAiJustification(null);
        addLog('AI', `Requesting fuel calculation for ${selectedItems.length} equipment types...`);
        try {
            const { results, sources: apiSources, prompt, justification } = await calculateFuelConsumption(selectedItems, period);
            
            addLog('AI', `Prompt sent to AI:\n${prompt}`);

            const resultsById = new Map(results.map(r => [r.id, r]));
            setSelectedItems(prevItems =>
                prevItems.map(item => {
                    const result = resultsById.get(item.id);
                    if (result) {
                        return { ...item, fuel: result.fuelConsumption, rate: result.rate, idleRate: result.idleRate };
                    }
                    return item;
                })
            );
            
            setSources(apiSources);
            setAiJustification(justification);
            addLog('SUCCESS', 'AI calculation successful. Fuel estimates updated.');
            addLog('AI', `AI Justification: ${justification}`);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during calculation.";
            console.error(e);
            setError(errorMessage);
            addLog('ERROR', `Calculation failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordRound = () => {
        const totalFuel = selectedItems.reduce((acc, item) => acc + (item.fuel || 0) * item.quantity, 0);
        if (totalFuel > 0) {
            const newRoundId = `R-${Date.now()}`;
            const newRound: Round = {
                id: newRoundId,
                name: roundName.trim() || `Round ${newRoundId}`,
                period,
                items: selectedItems,
                totalFuel,
                timestamp: new Date().toISOString(),
                aiJustification: aiJustification || undefined,
            };
            setRounds(prevRounds => [newRound, ...prevRounds]);
            addLog('SUCCESS', `Round "${newRound.name}" recorded successfully. Total fuel: ${totalFuel.toFixed(2)}L.`);
            handleClearSelection();
        } else {
            const msg = "Cannot record a round with zero fuel consumption. Please calculate first.";
            setError(msg);
            addLog('ERROR', msg);
        }
    };

    const handleDeleteRound = useCallback((roundId: string) => {
        if (window.confirm('Are you sure you want to delete this round? This action cannot be undone.')) {
            const roundToDelete = rounds.find(r => r.id === roundId);
            setRounds(prevRounds => prevRounds.filter(r => r.id !== roundId));
            if(roundToDelete) {
                addLog('INFO', `Deleted round "${roundToDelete.name}".`);
            }
        }
    }, [rounds, addLog]);

    const handleGetAiInsights = useCallback(async () => {
        if (rounds.length === 0) {
            addLog('ERROR', 'Cannot generate insights without at least one recorded round.');
            return;
        }
        setIsInsightsLoading(true);
        setAiInsights(null);
        addLog('AI', 'Requesting AI-powered insights based on all recorded rounds...');
        try {
            const insights = await getAiInsights(rounds);
            setAiInsights(insights);
            addLog('SUCCESS', 'Successfully generated AI insights.');
            addLog('AI', `Insights Received: ${insights.substring(0, 100)}...`);
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while getting AI insights.";
            console.error(e);
            setError(errorMessage);
            addLog('ERROR', `Failed to get insights: ${errorMessage}`);
        } finally {
            setIsInsightsLoading(false);
        }
    }, [rounds, addLog]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        event.target.value = '';

        handleClearSelection();
        setIsLoading(true);
        setError(null);
        addLog('INFO', `Reading XLSX file: ${file.name}...`);

        try {
            const reader = new FileReader();
            reader.onload = async (loadEvent) => {
                try {
                    const arrayBuffer = loadEvent.target?.result;
                    if (!arrayBuffer) {
                        throw new Error("Could not read file buffer.");
                    }
                    
                    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
                    
                    let allRows: any[] = [];
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        if (jsonData.length > 0) {
                           allRows = allRows.concat(jsonData);
                        }
                    });

                    if (allRows.length === 0) {
                        throw new Error("The XLSX file appears to be empty or contains no data rows.");
                    }
                    
                    addLog('INFO', `File read successfully with ${allRows.length} rows. Preparing for AI analysis...`);

                    const BATCH_SIZE = 50;
                    const batches = [];
                    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
                        batches.push(allRows.slice(i, i + BATCH_SIZE));
                    }

                    addLog('AI', `Split ${allRows.length} rows into ${batches.length} batch(es) of up to ${BATCH_SIZE} rows each.`);

                    const batchPromises = batches.map((batch, index) => {
                        addLog('AI', `Sending batch ${index + 1} of ${batches.length} for processing...`);
                        return normalizeImportedDataWithAI(batch);
                    });

                    const batchResults = await Promise.all(batchPromises);

                    const processedRows = batchResults.flatMap(result => result.processedRows);
                    
                    if (processedRows.length === 0) {
                         addLog('ERROR', 'AI processed the file but did not find any recognizable equipment data. Please check the file content and column headers.');
                    } else {
                        const newSelectedItems: SelectedItem[] = processedRows
                            .filter(row => row.name !== "Unknown Equipment")
                            .map((row, index) => ({
                                name: row.name,
                                category: row.category,
                                quantity: 1,
                                hours: row.hours,
                                idleHours: row.idleHours,
                                id: `imported-${row.name}-${index}-${Date.now()}`,
                                fuel: undefined,
                            }));
                        
                        const firstValidRoundName = processedRows.find(row => row.roundNameCandidate)?.roundNameCandidate || null;

                        setSelectedItems(newSelectedItems);
                        setRoundName(firstValidRoundName || '');
                        addLog('SUCCESS', `Successfully imported and processed ${newSelectedItems.length} equipment entries from the file.`);
                        
                        if(firstValidRoundName) {
                            addLog('INFO', `Round name "${firstValidRoundName}" was extracted from the file.`);
                        }
                    }
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during file processing.";
                    console.error(e);
                    setError(errorMessage);
                    addLog('ERROR', `File import failed: ${errorMessage}`);
                } finally {
                    setIsLoading(false);
                }
            };

            reader.onerror = () => {
                const errorMessage = "Failed to read the file.";
                setError(errorMessage);
                addLog('ERROR', errorMessage);
                setIsLoading(false);
            };

            reader.readAsArrayBuffer(file);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while preparing the file.";
            setError(errorMessage);
            addLog('ERROR', errorMessage);
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = useCallback(() => {
        const instructionData = [
            ["Instructions for Filling Out the Template"],
            [],
            ["1. Sheet 'EquipmentData'"],
            ["   - This is where you should input your equipment usage data."],
            [],
            ["2. Column 'Round Name' (Optional)"],
            ["   - If all rows in the file belong to the same round, you can put the name here."],
            ["   - The app will use the first non-empty name it finds in this column."],
            [],
            ["3. Column 'Grouping'"],
            ["   - Enter the equipment name. The AI is smart enough to handle variations like 'TELEHANDLERS [115-0023]' or just 'Telehandler'."],
            [],
            ["4. Columns 'Active hours' and 'Idling hours'"],
            ["   - Enter the duration of work."],
            ["   - Use formats like 'HH:MM:SS' (e.g., '4:12:29') or include days: 'X days HH:MM:SS' (e.g., '1 days 10:15:04')."],
            [],
            ["5. Multiple Sheets"],
            ["   - You can include multiple sheets with the same format. The AI will read and combine the data from all of them."]
        ];

        const templateData = [
            ['Round Name', 'Grouping', 'Active hours', 'Idling hours'],
            ['Site Alpha - Week 34', 'TELEHANDLERS [115-0023]', '4:12:29', '8:25:10'],
            ['Site Alpha - Week 34', 'SKID_STEER [119-0023]', '1 days 8:08:33', '3 days 2:31:32'],
            ['', 'BACKHOE_LOADER [109-0007]', '3:22:16', '11:46:09'],
            ['', 'COMPACTOR [127-0021]', '0:02:14', '3:32:12'],
            ['', 'TOWER_LIGHTS', '0:00:00', '1:46:48']
        ];

        const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionData);
        const dataSheet = XLSX.utils.aoa_to_sheet(templateData);
        
        instructionsSheet['!cols'] = [{ wch: 80 }];
        dataSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
        XLSX.utils.book_append_sheet(workbook, dataSheet, 'EquipmentData');

        XLSX.writeFile(workbook, 'EquipmentDataTemplate.xlsx');
        addLog('INFO', 'Downloaded equipment data template.');
    }, [addLog]);

    const handleExportXlsx = useCallback(() => {
        if(rounds.length > 0) {
            exportToXlsx(rounds);
            addLog('INFO', 'Exported rounds to XLSX.');
        }
    }, [rounds, addLog]);

    const handleExportHtml = useCallback(() => {
         if(rounds.length > 0) {
            exportToHtml(rounds);
            addLog('INFO', 'Exported rounds to HTML.');
        }
    }, [rounds, addLog]);

    const isCalculationDone = useMemo(() =>
        selectedItems.length > 0 && selectedItems.every(item => item.fuel !== undefined),
        [selectedItems]
    );

    const totalRoundsFuel = useMemo(() =>
        rounds.reduce((sum, round) => sum + round.totalFuel, 0),
        [rounds]
    );
    
    const renderTabButton = (tabName: 'selection' | 'dashboard' | 'rounds' | 'log', label: string, count: number) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                aria-current={isActive}
                className={`flex-1 py-3 px-2 text-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 text-sm sm:text-base ${
                    isActive
                        ? 'bg-gray-900/50 text-teal-400 border-b-2 border-teal-400'
                        : 'text-gray-300 hover:bg-gray-700/50'
                }`}
            >
                {label} {count > 0 && `(${count})`}
            </button>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
            <Header onFileUpload={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} isLoading={isLoading} />
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="lg:col-span-2">
                    <EquipmentGrid onAddItem={handleAddItem} selectedItems={selectedItems} />
                </div>
                <div className="flex flex-col bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 flex-shrink-0">
                        {renderTabButton('selection', 'Selection', selectedItems.length)}
                        {renderTabButton('dashboard', 'Dashboard', 0)}
                        {renderTabButton('rounds', 'Rounds', rounds.length)}
                        {renderTabButton('log', 'System Log', 0)}
                    </div>

                    {/* Panel Content */}
                    <div className="flex-grow overflow-y-auto">
                        {activeTab === 'selection' && (
                            <SelectionPanel
                                items={selectedItems}
                                period={period}
                                roundName={roundName}
                                onUpdateItem={handleUpdateItem}
                                onRemoveItem={handleRemoveItem}
                                onClear={handleClearSelection}
                                onSetPeriod={setPeriod}
                                onSetRoundName={setRoundName}
                                onCalculate={handleCalculate}
                                onRecordRound={handleRecordRound}
                                isLoading={isLoading}
                                error={error}
                                isCalculationDone={isCalculationDone}
                                aiJustification={aiJustification}
                            />
                        )}
                        {activeTab === 'dashboard' && (
                             <DashboardPanel 
                                rounds={rounds}
                                onGetAiInsights={handleGetAiInsights}
                                insights={aiInsights}
                                isInsightsLoading={isInsightsLoading}
                            />
                        )}
                        {activeTab === 'rounds' && (
                            <RoundsPanel
                                rounds={rounds}
                                totalFuel={totalRoundsFuel}
                                onExportXlsx={handleExportXlsx}
                                onExportHtml={handleExportHtml}
                                onDeleteRound={handleDeleteRound}
                            />
                        )}
                        {activeTab === 'log' && (
                            <LogPanel logs={logs} onClearLogs={handleClearLogs} />
                        )}
                    </div>
                </div>
            </main>
            {sources.length > 0 && (
                <footer className="bg-gray-800 p-2 border-t border-gray-700 text-center text-xs text-gray-400 overflow-x-auto whitespace-nowrap">
                    <span className="font-semibold">Sources: </span>
                    {sources.map((source, index) => (
                        <a key={index} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-teal-400">
                           {source.web?.title || source.web?.uri}
                        </a>
                    ))}
                </footer>
            )}
        </div>
    );
}
