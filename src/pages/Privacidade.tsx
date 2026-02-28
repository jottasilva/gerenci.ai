import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacidade = () => {
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
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                        <Shield className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
                        Política de Privacidade
                    </h1>
                    <p className="mt-4 text-lg text-slate-600">
                        Sua privacidade e a segurança dos seus dados são nossa prioridade máxima.
                    </p>
                    <p className="text-sm text-slate-400 mt-2">Última atualização: 28 de Fevereiro de 2026</p>
                </div>

                <div className="space-y-8">
                    <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-indigo-600 text-white">
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Compromisso com a LGPD
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 text-slate-700 leading-relaxed">
                            <p>
                                O <strong>Gerenc.AI</strong> está em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                                Implementamos medidas técnicas e organizacionais avançadas para garantir que seus dados pessoais e os de seus clientes
                                sejam tratados com transparência, segurança e respeito aos seus direitos.
                            </p>
                        </CardContent>
                    </Card>

                    <section className="grid gap-6 md:grid-cols-2">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Dados que Coletamos</h3>
                            <ul className="space-y-2 text-slate-600 text-sm">
                                <li>• Nome e WhatsApp para identificação e login.</li>
                                <li>• CPF/CNPJ para emissão de documentos fiscais.</li>
                                <li>• Endereço para logística de entregas.</li>
                                <li>• Histórico de pedidos para gestão do negócio.</li>
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                <Eye className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Como Usamos</h3>
                            <ul className="space-y-2 text-slate-600 text-sm">
                                <li>• Para processar vendas e gerenciar estoque.</li>
                                <li>• Para cumprir obrigações fiscais e legais.</li>
                                <li>• Para melhorar a experiência do sistema.</li>
                                <li>• Apenas com seu consentimento, para comunicações.</li>
                            </ul>
                        </div>
                    </section>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Lock className="h-5 w-5 text-indigo-500" />
                                Segurança e Armazenamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-600 text-sm leading-relaxed">
                            <p>
                                Utilizamos <strong>Criptografia AES-256</strong> para proteger dados sensíveis como CPF e CNPJ em nosso banco de dados.
                                Isso significa que, mesmo em caso de acesso não autorizado, os dados permanecem ilegíveis.
                            </p>
                            <p>
                                Além disso, mantemos <strong>Logs de Auditoria</strong> rigorosos para monitorar quem acessou quais dados e quando,
                                garantindo total rastreabilidade e responsabilidade.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm border-l-4 border-l-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <FileText className="h-5 w-5 text-indigo-500" />
                                Seus Direitos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-600 text-sm leading-relaxed">
                            <p>De acordo com o Art. 18 da LGPD, você pode, a qualquer momento, solicitar:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full" />
                                    <span>Acesso aos seus dados</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full" />
                                    <span>Portabilidade de dados</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full" />
                                    <span>Exclusão ou Anonimização</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full" />
                                    <span>Correção de dados incompletos</span>
                                </div>
                            </div>
                            <p className="mt-4 pt-4 border-t border-slate-100 font-medium">
                                Para exercer seus direitos, entre em contato através do WhatsApp de suporte da plataforma ou pelo e-mail do nosso DPO.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 text-center text-slate-400 text-xs">
                    <p>© 2026 Gerenc.AI. Todos os direitos reservados. Garantindo a segurança do seu negócio.</p>
                </div>
            </div>
        </div>
    );
};

export default Privacidade;
