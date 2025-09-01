import { useState } from "react";

const insightsMock = [
    "Tus ventas crecieron 10% esta semana. Considera reponer stock de arroz.",
    "El producto más vendido hoy fue: Gaseosa 1L.",
    "Tu margen de ganancia promedio es 35%, excelente!",
    "Revisa el inventario: 3 productos con stock bajo.",
];

export default function Insights() {
    const [index, setIndex] = useState(0);

    const regenerate = () => {
        setIndex((prev) => (prev + 1) % insightsMock.length);
    };

    return (
        <div className="min-h-screen bg-yellow-400 flex justify-center items-start py-12 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 text-center text-yellow-600 flex items-center gap-2">
                    <span>💡</span> Consejos Inteligentes
                </h2>
                <p className="text-gray-500 text-center mb-8">
                    Insights generados por IA para optimizar tu negocio
                </p>
                <div className="bg-blue-50 rounded-xl p-6 mb-8 shadow flex flex-col items-center">
                    <p className="text-gray-700 text-lg text-center mb-4 font-medium">
                        {insightsMock[index]}
                    </p>
                    <button onClick={regenerate} className="btn btn-primary">
                        Regenerar
                    </button>
                </div>
                {/* Puedes agregar más tarjetas de insights aquí si lo deseas */}
            </div>
        </div>
    );
}