// 'utilizar cliente'

import {
    ChevronDown,
    ChevronUp,
    Cargador2,
    RotateCw,
    Search,
  } from 'lucide-react';
  import { Documento, Page, pdfjs } from 'react-pdf';
  
  import 'react-pdf/dist/Page/AnnotationLayer.css';
  import 'react-pdf/dist/Page/TextLayer.css';
  import { useToast } from './ui/use-toast';
  
  import { useResizeDetector } from 'react-resize-detector';
  import { Boton } from './ui/button';
  import { Input } from './ui/input';
  import { useState } from 'react';
  
  import { useForm } from 'react-hook-form';
  import { z } from 'zod';
  
  import { zodResolver } from '@hookform/resolvers/zod';
  import { cn } from '@/lib/utils';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from './ui/dropdown-menu';
  
  import SimpleBar from 'simplebar-react';
  import PdfFullscreen from './PdfFullscreen';
  
  // Configuración del trabajador global de pdf.js
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
  
  // Interfaz para las propiedades del componente PdfRenderer
  interface PdfRendererProps {
    url: string;
  }
  
  // Componente principal que renderiza un visor de PDF
  const PdfRenderer = ({ url }: PdfRendererProps) => {
    // Utilizar el hook de tostadas para mostrar mensajes
    const { toast } = useToast();
  
    // Estados locales del componente
    const [numPages, setNumPages] = useState<number>();
    const [currPage, setCurrPage] = useState<number>(1);
    const [scale, setScale] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
    const [renderedScale, setRenderedScale] = useState<number | null>(null);
  
    // Verificar si la escala de renderizado es diferente de la escala actual
    const isLoading = renderedScale !== scale;
  
    // Definir un validador personalizado para el número de página
    const CustomPageValidator = z.object({
      page: z
        .string()
        .refine((num) => Number(num) > 0 && Number(num) <= numPages!),
    });
  
    // Tipo inferido para el validador personalizado
    type TCustomPageValidator = z.infer<typeof CustomPageValidator>;
  
    // Configurar el hook useForm para el formulario de la página
    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
    } = useForm<TCustomPageValidator>({
      defaultValues: {
        page: '1',
      },
      resolver: zodResolver(CustomPageValidator),
    });
  
    // Imprimir errores en la consola (para propósitos de desarrollo)
    console.log(errors);
  
    // Configurar el hook useResizeDetector para detectar cambios en el tamaño
    const { width, ref } = useResizeDetector();
  
    // Manejar la presentación del formulario de cambio de página
    const handlePageSubmit = ({ page }: TCustomPageValidator) => {
      setCurrPage(Number(page));
      setValue('page', String(page));
    };
  
    // Renderizar el componente
    return (
      <div className='w-full bg-white rounded-md shadow flex flex-col items-center'>
        {/* Encabezado con controles de navegación */}
        <div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2'>
          <div className='flex items-center gap-1.5'>
            {/* Botón para retroceder a la página anterior */}
            <Boton
              disabled={currPage <= 1}
              onClick={() => {
                setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1));
                setValue('page', String(currPage - 1));
              }}
              variant='ghost'
              aria-label='página anterior'>
              <ChevronDown className='h-4 w-4' />
            </Boton>
  
            {/* Entrada de número de página */}
            <div className='flex items-center gap-1.5'>
              <Input
                {...register('page')}
                className={cn(
                  'w-12 h-8',
                  errors.page && 'focus-visible:ring-red-500'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(handlePageSubmit)();
                  }
                }}
              />
              <p className='text-zinc-700 text-sm space-x-1'>
                <span>/</span>
                <span>{numPages ?? 'x'}</span>
              </p>
            </div>
  
            {/* Botón para avanzar a la página siguiente */}
            <Boton
              disabled={
                numPages === undefined || currPage === numPages
              }
              onClick={() => {
                setCurrPage((prev) =>
                  prev + 1 > numPages! ? numPages! : prev + 1
                );
                setValue('page', String(currPage + 1));
              }}
              variant='ghost'
              aria-label='página siguiente'>
              <ChevronUp className='h-4 w-4' />
            </Boton>
          </div>
  
          {/* Controles de zoom y rotación */}
          <div className='space-x-2'>
            {/* Menú desplegable para el zoom */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Boton
                  className='gap-1.5'
                  aria-label='zoom'
                  variant='ghost'>
                  <Search className='h-4 w-4' />
                  {scale * 100}%
                  <ChevronDown className='h-3 w-3 opacity-50' />
                </Boton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setScale(1)}>
                  100%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(1.5)}>
                  150%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(2)}>
                  200%
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setScale(2.5)}>
                  250%
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
  
            {/* Botón para rotar 90 grados */}
            <Boton
              onClick={() => setRotation((prev) => prev + 90)}
              variant='ghost'
              aria-label='rotar 90 grados'>
              <RotateCw className='h-4 w-4' />
            </Boton>
  
            {/* Componente para visualización en pantalla completa */}
            <PdfFullscreen fileUrl={url} />
          </div>
        </div>
  
        {/* Cuerpo del visor de PDF */}
        <div className='flex-1 w-full max-h-screen'>
          {/* Barra de desplazamiento simple */}
          <SimpleBar
            autoHide={false}
            className='max-h-[calc(100vh-10rem)]'>
            <div ref={ref}>
              {/* Componente Documento de react-pdf */}
              <Documento
                loading={
                  <div className='flex justify-center'>
                    <Cargador2 className='my-24 h-6 w-6 animate-spin' />
                  </div>
                }
                onLoadError={() => {
                  // Mostrar tostada de error si hay un problema al cargar el PDF
                  toast({
                    title: 'Error al cargar el PDF',
                    description: 'Por favor, inténtalo de nuevo más tarde',
                    variant: 'destructive',
                  });
                }}
                onLoadSuccess={({ numPages }) =>
                  setNumPages(numPages)
                }
                file={url}
                className='max-h-full'>
                {isLoading && renderedScale ? (
                  // Renderizar la página actual con la escala y rotación especificadas
                  <Page
                    width={width ? width : 1}
                    pageNumber={currPage}
                    scale={scale}
                    rotate={rotation}
                    key={'@' + renderedScale}
                  />
                ) : null}
  
                {/* Componente de página adicional con eventos de renderizado */}
                <Pagina
                  className={cn(isLoading ? 'hidden' : '')}
                  width={width ? width : 1}
                  pageNumber={currPage}
                  scale={scale}
                  rotate={rotation}
                  key={'@' + scale}
                  loading={
                    <div className='flex justify-center'>
                      <Cargador2 className='my-24 h-6 w-6 animate-spin' />
                    </div>
                  }
                  onRenderSuccess={() =>
                    setRenderedScale(scale)
                  }
                />
              </Documento>
            </div>
          </SimpleBar>
        </div>
      </div>
    );
  };
  
  // Exportar el componente como predeterminado
  export default PdfRenderer;
  