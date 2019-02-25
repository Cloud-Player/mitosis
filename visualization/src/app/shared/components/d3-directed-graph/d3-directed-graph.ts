import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import {Selection} from 'd3-selection';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {LayoutChangeTypes, LayoutService} from '../../services/layout';
import {DirectedGraphModel} from './models/directed-graph-model';
import {EdgeModel} from './models/edge-model';
import {NodeModel} from './models/node-model';

@Component({
  selector: 'app-d3-directed-graph',
  templateUrl: './d3-directed-graph.html',
  styleUrls: ['./d3-directed-graph.scss'],
  encapsulation: ViewEncapsulation.None
})
export class D3DirectedGraphComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  private margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {top: 20, right: 20, bottom: 30, left: 40};
  private width;
  private height;
  private svg: Selection<any, any, any, any>;
  private zoomHolder: Selection<any, any, any, any>;
  private simulation: any;
  private zoomHandler: any;
  private nodeColor = '#ccc';
  private selectedNode: NodeModel;
  private subscriptions: Subscription;
  private metaKeyPressed = 0;
  @Input()
  public model: DirectedGraphModel<NodeModel, EdgeModel>;
  @Output()
  public selectedNodeChange: EventEmitter<NodeModel>;

  constructor(private el: ElementRef, private renderer: Renderer2, private layoutService: LayoutService) {
    this.selectedNodeChange = new EventEmitter();
    this.subscriptions = new Subscription();
  }

  private dragstarted(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(d: any) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  private dragended(d: any) {
    if (!this.metaKeyPressed) {
      if (!d3.event.active) {
        this.simulation.alphaTarget(0).restart();
      }
      d.fx = null;
      d.fy = null;
    }
  }

  private zoomActions() {
    this.zoomHolder.attr('transform', d3.event.transform);
  }

  private edgeOpacityTransformer(edge: EdgeModel) {
    if (
      !this.selectedNode ||
      this.selectedNode && edge.getSourceId() === this.selectedNode.getId() ||
      edge.getTargetId() === this.selectedNode.getId()) {
      return 1;
    } else {
      return 0.3;
    }
  }

  private tick() {
    const links = d3.select('.links').selectAll('.link');
    const nodes = d3.select('.nodes').selectAll('.node');
    const inComingArrows = d3.select('defs').selectAll('.marker-incoming');
    const outgoingArrows = d3.select('defs').selectAll('.marker-outgoing');

    links
      .attr('d', (d: any) => {
        const offset = 10 * d.getOffset();

        const midpoint_x = (d.source.x + d.target.x) / 2;
        const midpoint_y = (d.source.y + d.target.y) / 2;

        const dx = (d.target.x - d.source.x);
        const dy = (d.target.y - d.source.y);

        const normalise = Math.sqrt((dx * dx) + (dy * dy));

        const offSetX = midpoint_x + offset * (dy / normalise);
        const offSetY = midpoint_y - offset * (dx / normalise);

        return `M${d.source.x},${d.source.y}S${offSetX},${offSetY} ${d.target.x},${d.target.y}`;
      })
      .attr('opacity', (e: EdgeModel) => {
        return this.edgeOpacityTransformer(e);
      })
      .attr('stroke', (e: EdgeModel) => {
        return e.strokeColorTransformer();
      })
      .attr('stroke-dasharray', (e: EdgeModel): any => {
        return e.strokeDashArrayTransformer();
      });

    inComingArrows
      .attr('fill', (e: EdgeModel) => {
        return e.strokeColorTransformer();
      })
      .attr('opacity', (e: EdgeModel) => {
        if (e.showIncomingArrowTransformer()) {
          return this.edgeOpacityTransformer(e);
        } else {
          return 0;
        }
      });

    outgoingArrows
      .attr('fill', (e: EdgeModel) => {
        return e.strokeColorTransformer();
      })
      .attr('opacity', (e: EdgeModel) => {
        if (e.showOutgoingArrowTransformer()) {
          return this.edgeOpacityTransformer(e);
        } else {
          return 0;
        }
      });

    nodes
      .attr('transform', (n: NodeModel) => {
        return 'translate(' + n.x + ',' + n.y + ')';
      });

    nodes
      .select('text')
      .attr('fill', (n: NodeModel) => {
        return n.textColorTransformer();
      })
      .attr('font-weight', (n: NodeModel) => {
        return n.textFontWeightTransformer();
      });

    nodes
      .select('ellipse')
      .attr('stroke', (n: NodeModel) => {
        if (n.isSelected()) {
          return n.ellipseStrokeColorSelectedTransformer();
        } else {
          return n.ellipseStrokeColorTransformer();
        }
      })
      .attr('stroke-width', (n: NodeModel) => {
        return n.ellipseStrokeWidthTransformer();
      })
      .attr('fill', (n: NodeModel) => {
        return n.ellipseFillTransformer();
      });
  }

  private initD3() {
    const holderEl = this.el.nativeElement.querySelector('.d3-directed-graph');
    holderEl.innerHTML = '';

    this.svg = d3.select(holderEl)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height - 5)
      .on('click', () => {
        if (this.selectedNode) {
          this.selectedNode.setSelected(false);
          this.selectedNode = null;
          this.selectedNodeChange.emit(null);
        }
      });

    this.svg
      .append('svg:defs')
      .attr('class', 'arrows');

    this.zoomHolder = this.svg
      .append('g')
      .attr('class', 'zoom-holder-el');

    this.simulation = d3.forceSimulation()
      .force('collide',
        d3.forceCollide(30)
          .iterations(2))
      .force('link',
        d3.forceLink()
          .id((d: any) => d.getId())
          .distance(100)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody())
      .force('x', d3.forceX(this.width / 2))
      .force('y', d3.forceY(this.height / 2))
      .on('tick', this.tick.bind(this));

    this.zoomHandler = d3.zoom()
      .on('zoom', this.zoomActions.bind(this));

    this.zoomHandler(this.svg);

    this.zoomHolder.append('g')
      .attr('class', 'links')
      .selectAll('link');

    this.zoomHolder.append('g')
      .attr('class', 'nodes')
      .selectAll('.node');
  }

  private update() {

    let node = d3.select('.nodes').selectAll('.node');
    node = node.data(this.model.getNodes(), (d: NodeModel) => d.getId());

    const nodeHolder = node
      .enter()
      .append('g')
      .attr('class', 'node');

    nodeHolder
      .append('ellipse')
      .attr('rx', 16)
      .attr('ry', 14)
      .attr('fill', this.nodeColor)
      .on('click', (d: NodeModel) => {
        d3.event.stopPropagation();
        this.selectNode(d.getId());
      });

    nodeHolder
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    nodeHolder
      .append('text')
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dx', 0)
      .attr('dy', '.35em')
      .text((d: NodeModel) => {
        return d.getId();
      });

    node.exit()
      .remove();

    let incomingArrow = d3.selectAll('defs').selectAll('.marker-incoming');
    incomingArrow = incomingArrow.data(this.model.getEdges(), (d: EdgeModel) => d.getId());

    incomingArrow
      .enter()
      .append('svg:marker')    // This section adds in the arrows
      .attr('id', (d: EdgeModel) => `incoming-${d.getId()}`)
      .attr('viewBox', '-10 -5 10 10')
      .attr('refX', -20)
      .attr('refY', -0.5)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .attr('class', 'marker-incoming')
      .append('svg:path')
      .attr('d', 'M0,-5L-10,0L0,5');

    let outgoingArrow = d3.selectAll('defs').selectAll('.marker-outgoing');
    outgoingArrow = incomingArrow.data(this.model.getEdges(), (d: EdgeModel) => d.getId());

    outgoingArrow
      .enter()
      .append('svg:marker')    // This section adds in the arrows
      .attr('id', (d: EdgeModel) => `outgoing-${d.getId()}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', -0.5)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .attr('class', 'marker-outgoing')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    outgoingArrow.exit()
      .remove();

    let link = d3.select('.links').selectAll('.link');
    link = link.data(this.model.getEdges(), (d: EdgeModel) => d.getId());

    link
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke-width', 3)
      .attr('marker-start', (d: EdgeModel) => `url(#incoming-${d.getId()})`)
      .attr('marker-end', (d: EdgeModel) => `url(#outgoing-${d.getId()})`);

    link.exit()
      .remove();

    this.simulation
      .nodes(this.model.getNodes());

    this.simulation
      .force('link')
      .links(this.model.getEdges());

    if (!node.enter().empty() || !node.exit().empty()) {
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0).restart();
    }
  }

  private resize() {
    this.svg.attr('width', 0);
    this.svg.attr('height', 0);
    setTimeout(() => {
      this.width = this.el.nativeElement.offsetWidth;
      this.height = this.el.nativeElement.offsetHeight;
      this.svg.attr('width', this.width);
      this.svg.attr('height', this.height - 5);
      this.simulation
        .force('x', d3.forceX(this.width / 2))
        .force('y', d3.forceY(this.height / 2));
    });
  }

  public selectNode(nodeId: string) {
    let selectedNode: NodeModel;
    d3.selectAll('.node').each((d: NodeModel) => {
      if (!selectedNode && d.getId().match(nodeId)) {
        selectedNode = d;
      }
      if (d.isSelected()) {
        d.setSelected(false);
      }
    });

    if (selectedNode) {
      selectedNode.setSelected(true);
      this.selectedNode = selectedNode;
      this.selectedNodeChange.emit(selectedNode);
    }
  }

  ngOnInit(): void {
    this.layoutService.getObservable()
      .pipe(
        filter(ev => ev.changeType === LayoutChangeTypes.windowSizeChange)
      )
      .subscribe(
        this.resize.bind(this)
      );

    this.subscriptions.add(
      this.renderer.listen(window, 'keydown', (e) => {
        if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt') {
          this.metaKeyPressed++;
        }
      })
    );

    this.subscriptions.add(
      this.renderer.listen(window, 'keyup', (e) => {
        if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt') {
          this.metaKeyPressed--;
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    this.height = this.el.nativeElement.offsetHeight;
    this.initD3();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.model.currentValue && this.width) {
      this.update();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
