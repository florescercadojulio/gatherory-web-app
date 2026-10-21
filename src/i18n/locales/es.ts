const es = {
  event: {
    couldNotRefresh:
      'Gatherory no pudo actualizar estos detalles. Puedes seguir usando el resto del evento.',
  },
  blueprints: {
    captureNoWorkspace: 'Elige o crea una biblioteca de planos antes de guardar un plano privado.',
    shareLinksPrivacy:
      'Cualquier persona con el enlace puede ver y reenviar el contenido publicado y copiarlo en un plan independiente. Revisa los datos personales y códigos de acceso antes de compartirlo. El evento de origen y tu biblioteca siguen siendo privados.',
    sharedCopyHint: 'Abre Gatherory para guardar este plano o crear tu propio evento.',
    ownerWorkspace: 'Guardar en biblioteca',
    personalWorkspace: 'Biblioteca personal',
    ownerWorkspaceHelp: 'La biblioteca seleccionada contiene este plano privado.',
    noWorkspace: 'Crea una biblioteca personal antes de guardar un plano.',
    createWorkspace: 'Crear biblioteca personal',
    workspaceCreated: 'La biblioteca personal está lista.',
    workspaceCreateFailed: 'No se pudo crear la biblioteca personal. Inténtalo de nuevo.',
  },
  notFound: {
    description:
      'El enlace puede estar desactualizado o la página puede haberse movido a otro evento.',
  },
  feedback: {
    workspacePrepareTitle: 'No se pudo preparar tu evento',
    workspacePrepareDescription:
      'El resto de Gatherory sigue disponible. Intenta cargar tu evento de nuevo.',
    workspaceLoadTitle: 'No se pudo cargar este evento',
    workspaceLoadDescription:
      'Tus otras páginas de Gatherory siguen disponibles. Intenta cargar este evento de nuevo.',
  },
  roles: {
    host: 'anfitrión',
    collaborator: 'colaborador',
    guest: 'invitado',
  },
  invitation: {
    title: 'Invitación de Gatherory',
    invalid: 'Este enlace de invitación no es válido. Pide otro al anfitrión.',
    sharedJoin:
      'Inicia sesión o crea una cuenta para continuar con esta invitación pública como {{role}}.',
    sharedCollaboratorJoin: 'Inicia sesión para ayudar a planificar este evento.',
    sharedCollaboratorApprovalJoin:
      'Inicia sesión para solicitar acceso como colaborador. El anfitrión debe aprobar tu solicitud antes de que puedas acceder al evento.',
    sharedCollaboratorViewOnlyJoin:
      'Inicia sesión para ver este evento y sus planes como colaborador.',
    sharedCollaboratorViewOnlyApprovalJoin:
      'Inicia sesión para solicitar acceso de solo lectura como colaborador. El anfitrión debe aprobar tu solicitud antes de que puedas ver el evento y sus planes.',
    sharedGuestJoin:
      'Puedes asistir como invitado desde la app de Gatherory para iPhone. Para continuar con esta invitación pública en el navegador, inicia sesión o crea una cuenta.',
    privateJoin:
      'Esta invitación privada requiere que inicies sesión o crees una cuenta en el navegador. Las invitaciones dirigidas a un correo deben aceptarse con una cuenta que use ese correo.',
    signIn: 'Iniciar sesión',
    signInToPlan: 'Inicia sesión para ayudar a planificar',
    signInToViewPlans: 'Inicia sesión para ver los planes',
    createAccount: 'Crear cuenta',
    createAccountToPlan: 'Crea una cuenta para ayudar a planificar',
    createAccountToViewPlans: 'Crea una cuenta para ver los planes',
    notLoaded: 'No se pudo cargar esta invitación. Comprueba que estés usando el correo invitado.',
    switchAccount: 'Cambiar de cuenta',
    joinedAs: 'Te uniste como {{role}}. El anfitrión ya puede incluirte en el evento.',
    refreshOnIPhone:
      'Abre Gatherory en tu iPhone y actualiza para ver este evento. El acceso de invitado es para asistir; el acceso de colaborador depende de los permisos para compartir del evento.',
    continue: 'Continuar a Gatherory',
    invitedAs: 'Te invitaron como {{role}}. Esta invitación vence el {{date}}.',
    collaboratorViewOnly: 'Este enlace de colaborador permite ver el evento.',
    collaboratorViewOnlyApproval:
      'Este enlace de colaborador permite ver el evento cuando el anfitrión apruebe tu solicitud.',
    collaboratorPlanning: 'Este enlace de colaborador permite ayudar a planificar el evento.',
    collaboratorPlanningApproval:
      'Este enlace de colaborador permite ayudar a planificar el evento cuando el anfitrión apruebe tu solicitud.',
    awaitingApproval:
      'Tu solicitud para unirte como colaborador espera la aprobación del anfitrión.',
    accepting: 'Aceptando…',
    accept: 'Aceptar invitación',
    expired: 'Esta invitación venció. Pide un enlace nuevo al anfitrión.',
    verifyEmail: 'Verifica tu correo y vuelve a esta invitación.',
    acceptedToast: 'Invitación aceptada',
    requestSentToast: 'Solicitud enviada para aprobación del anfitrión',
    acceptFailed: 'No se pudo aceptar la invitación. Inténtalo de nuevo.',
  },
} as const

export default es
