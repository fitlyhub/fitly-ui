# Fitly Frontend Architecture

Muc tieu cua cau truc nay la giu phan "engine" metadata-driven tach biet khoi module ERP cu the, de co the mo rong len hang tram man hinh ma van de maintain.

## Cau truc de xuat

```text
src/
  app/                         # Bootstrap, providers, theming, route shell
  features/
    auth/                      # Login, session state, auth API
    workspace/                 # Sidebar, header, active module shell
  shared/
    lib/                       # Utilities thuần, mappers, formatters
    ui/                        # Atomic/presentational components dung lai toan app
  engines/
    dynamic-form/              # Engine render form tu metadata
    dynamic-page/              # Engine render hero/stats/table/form tu metadata
```

## Nguyen tac

- `shared/` chi chua code hoan toan generic, khong phu thuoc business domain.
- `engines/` chua reusable renderers nhu dynamic form/page va cac adapters sang Ant Design.
- `features/auth` tach rieng authentication khoi shell va dynamic content.
- `features/workspace` giu layout co dinh sau login: sidebar, header, module context.
- `features/` la noi mo rong theo module ERP nhu Users, Inventory, Finance, PO.
- Hook xu ly logic dat gan engine hoac feature, UI components giu thuần render.
- Metadata backend nen co version de frontend co the backward-compatible khi schema thay doi.

## Mock backend metadata

```json
{
  "entity": "user",
  "version": 1,
  "fields": [
    {
      "fieldName": "fullName",
      "label": "Full name",
      "type": "text",
      "defaultValue": "",
      "validationRules": {
        "required": { "value": true, "message": "Full name is required" },
        "minLength": { "value": 3, "message": "Use at least 3 characters" }
      }
    },
    {
      "fieldName": "age",
      "label": "Age",
      "type": "number",
      "validationRules": {
        "min": { "value": 18, "message": "Age must be 18 or above" }
      }
    }
  ]
}
```

Skeleton hien tai trong repo da follow dung huong nay, voi `DynamicFormRenderer` nam trong `src/engines/dynamic-form`.

## Record-list actions

Man hinh dang grid/list-detail dung `record-list`. Backend co the cau hinh:

- `defaultActions`: bat/tat va doi label cho `create`, `importExcel`, `exportExcel`, `attachFile`.
- `toolbarActions`: action cap man hinh/record, vi du approve, refresh.
- `fieldActions`: action gan voi field/record, vi du gui email theo field `vendor`.
- `scope`: `list`, `detail`, hoac `both` de quyet dinh nut xuat hien o danh sach, chi tiet, hay ca hai.
- `requiresSelection` va `targetField` de disable nut khi chua co record dang chon.
