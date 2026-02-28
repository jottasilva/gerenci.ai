import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, FileCheck, ShieldAlert, ArrowLeft, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Termos = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-8 hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-4">
                        <Scale className="h-8 w-8 text-amber-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
                        Termos de Uso
                    </h1>
                    <p className="mt-4 text-lg text-slate-600">
                        Regras e diretrizes para o uso seguro e legal da plataforma Gerenc.AI.
                    </p>
                    <p className="text-sm text-slate-400 mt-2">Última atualização: 28 de Fevereiro de 2026</p>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-sm bg-indigo-900 text-indigo-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCheck className="h-5 w-5" />
                                Aceitação dos Termos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="leading-relaxed opacity-90">
                            <p>
                                Ao acessar ou utilizar o Gerenc.AI, você concorda em cumprir estes Termos de Uso e todas as leis
                                e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar
                                ou acessar este site.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                1. Uso da Licença
                            </h3>
                            <div className="space-y-3 text-slate-600 text-sm">
                                <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no Gerenc.AI apenas para visualização transitória pessoal e não comercial.</p>
                                <p>Esta licença não permite:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Modificar ou copiar os materiais;</li>
                                    <li>Usar os materiais para qualquer finalidade comercial;</li>
                                    <li>Tentar descompilar ou realizar engenharia reversa de qualquer software contido no site;</li>
                                    <li>Remover quaisquer direitos autorais ou outras notações de propriedade.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-indigo-500" />
                                2. Responsabilidades do Usuário
                            </h3>
                            <div className="space-y-3 text-slate-600 text-sm">
                                <p>O usuário é inteiramente responsável pelos dados inseridos no sistema, incluindo dados de seus clientes finais. O Gerenc.AI atua como <strong>Operador de Dados</strong>, enquanto o lojista atua como <strong>Controlador</strong> perante a LGPD.</p>
                                <p>É proibido o uso do sistema para fins ilegais, fraudulentos ou que violem os direitos de terceiros.</p>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Scale className="h-5 w-5 text-slate-500" />
                                3. Isenção de Responsabilidade
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Os materiais no Gerenc.AI são fornecidos 'como estão'. O Gerenc.AI não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual.
                            </p>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileCheck className="h-5 w-5 text-green-500" />
                                4. Precisão dos Materiais
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Os materiais exibidos no site do Gerenc.AI podem incluir erros técnicos, tipográficos ou fotográficos. O Gerenc.AI não garante que qualquer material em seu site seja preciso, completo ou atual. Podemos fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio.
                            </p>
                        </section>
                    </div>
                </div>

                <div className="mt-12 text-center text-slate-400 text-xs">
                    <p>© 2026 Gerenc.AI. Transparência legal para o seu crescimento.</p>
                </div>
            </div>
        </div>
    );
};

export default Termos;
