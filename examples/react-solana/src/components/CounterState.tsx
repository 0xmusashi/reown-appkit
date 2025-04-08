import { useEffect, useState } from "react";
import { program, counterPDA, type CounterData } from "../anchor/setup";
export default function CounterState() {
    const [counterData, setCounterData] = useState<CounterData | null>(null);

    useEffect(() => {
        const fetchCounterData = async () => {
            try {
                // Fetch initial account data
                const data = await program.account.counter.fetch(counterPDA);
                setCounterData(data);
            } catch (error) {
                console.error("Error fetching counter data:", error);
            }
        };

        fetchCounterData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [program, counterPDA]);

    // Render the value of the counter
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <p className="text-lg">Count: {counterData?.count?.toString()}</p>
        </div>
    )
}