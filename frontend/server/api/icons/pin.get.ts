import * as z from 'zod'
import { Resvg } from '@resvg/resvg-js'
import { defineEventHandlerWithAppErrorAsync, ValidationAppError } from '~~/server/lib/errors'
import { get_icon_internal } from './[hash].get'
import state from '~~/server/lib/server-state'

const RenderQuerySchema = z.object({
  h: z.coerce.number().int().gt(0).optional(), // height in pixels
  w: z.coerce.number().int().gt(0).optional(), // width in pixels
  bc: z.string().regex(/^[0-9a-f]{3,6}$/i).optional(), // border color code without the #
  fc: z.string().regex(/^[0-9a-f]{3,6}$/i).optional(), // fill color code without the #
  ih: z.string().optional(), // icon hash
})

/**
 * The /api/icons/pin GET endpoint, which returns the given icon as a map pin
 * Example : ?h=50&w=50&bc=222222&fc=9999ff&ih=1234567890abcdef
 */
export default defineEventHandlerWithAppErrorAsync(async (event): Promise<Buffer> => {
  const query = await getValidatedQuery(event, RenderQuerySchema.parse)
  const requested_height = query.h ?? (query.w == undefined ? 38 : undefined)
  const requested_width = query.w ?? (query.h == undefined ? 24 : undefined)
  const border_color = `#${query.bc ?? '222222'}`
  const fill_color = `#${query.fc ?? '9999FF'}`
  const icon_hash = query.ih

  if (requested_height != undefined && requested_height > 100) throw new ValidationAppError('invalid_size')
  if (requested_width != undefined && requested_width > 100) throw new ValidationAppError('invalid_size')

  const icon = icon_hash != undefined ? await get_icon_internal(icon_hash, state) : undefined

  let icon_svg: string | undefined
  if (icon) icon_svg = `<image
    x="9"
    y="9"
    width="26"
    height="26"
    xlink:href="http://icon"
  />`

  const pin_svg = `<svg
    version="1.1"
    viewBox="0 0 44 67"
    xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
  >
    <path
      d="m21.905 1.2688c-11.397-1.86e-5 -20.637 9.5307-20.636
      21.287 0.00476 3.5178 0.85467 6.9796 2.4736 10.076 5.9268 10.527 12.063 21.068 18.111
      31.572 5.8042-10.829 13.224-21.769 18.766-32.581
      1.4143-2.9374 1.9205-5.7872 1.9231-9.0669 6.2e-5 -11.757-9.2392-21.287-20.636-21.287z"
      fill="${fill_color}"
      stroke="${border_color}"
      stroke-width="2.5"
    />
    ${icon_svg ?? ''}
  </svg>`

  const pin_prerender = new Resvg(pin_svg, { font: { loadSystemFonts: false } })
  const pin_prerender_width = pin_prerender.width, pin_prerender_height = pin_prerender.height, pin_prerender_ratio = pin_prerender_width / pin_prerender_height
  let final_width: number | undefined, final_height: number | undefined, scale: number | undefined, fit_mode: 'width' | 'height' | undefined
  if (requested_height != undefined && requested_width != undefined) {
    if (requested_width / pin_prerender_ratio <= requested_height) {
      final_width = requested_width
      final_height = final_width / pin_prerender_ratio
      scale = final_width / pin_prerender_width
      fit_mode = 'width'
    }
    else {
      final_height = requested_height
      final_width = final_height * pin_prerender_ratio
      scale = final_height / pin_prerender_height
      fit_mode = 'height'
    }
  }
  else if (requested_height != undefined) {
    final_height = requested_height
    final_width = final_height * pin_prerender_ratio
    scale = final_width / pin_prerender_width
    fit_mode = 'height'
  }
  else if (requested_width != undefined) {
    final_width = requested_width
    final_height = final_width / pin_prerender_ratio
    scale = final_height / pin_prerender_height
    fit_mode = 'width'
  }
  else {
    throw 'missing both height and width'
  }

  let icon_data: Buffer | undefined
  if (icon && icon.http_mime_type.includes('svg')) {
    const icon_prerender = new Resvg(icon.data, { font: { loadSystemFonts: false } })
    const icon_prerender_width = icon_prerender.width, icon_prerender_height = icon_prerender.height
    let icon_fit_mode: 'width' | 'height' | undefined, icon_fit_value: number | undefined
    if (icon_prerender_width >= icon_prerender_height) {
      icon_fit_value = Math.ceil(26 * scale)
      icon_fit_mode = 'width'
    }
    else {
      icon_fit_value = Math.ceil(26 * scale)
      icon_fit_mode = 'height'
    }
    const icon_render = new Resvg(icon.data, {
      font: { loadSystemFonts: false },
      fitTo: { mode: icon_fit_mode, value: icon_fit_value },
    })
    const rendered = icon_render.render()
    icon_data = rendered.asPng()
  }
  else if (icon) icon_data = icon.data

  const pin_render = new Resvg(pin_svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: fit_mode, value: fit_mode == 'width' ? final_width : final_height } },
  )
  if (icon_data) pin_render.resolveImage('http://icon', icon_data)
  const rendered = pin_render.render()
  const pin_data = rendered.asPng()

  appendResponseHeaders(event, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=31536000',
  })

  return pin_data
})
